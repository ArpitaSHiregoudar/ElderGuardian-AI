# ElderGuardian AI — Comprehensive REST API Specification
**Version:** 1.0.0-PROD  
**Protocol:** REST over HTTPS / TLS 1.3  
**Base URL:** `/api/v1`  
**Target Architecture:** Node.js / Express / TypeScript / Prisma ORM / PostgreSQL / Redis  
**Security & Compliance:** ABDM (Ayushman Bharat Digital Mission) Compliant, HIPAA-aligned, DISHA (Digital Information Security in Healthcare Act) compliant  

---

## 1. API CONVENTIONS & ARCHITECTURE

### 1.1 Base URL & Transport
All requests must be served over HTTPS with TLS 1.3 minimum. Plain HTTP requests are rejected with status `403 Forbidden` or automatically redirected with `301 Moved Permanently` (HSTS enabled with 2-year `max-age` and preload).

```http
Base URL: https://api.elderguardian.ai/api/v1
Development: http://localhost:5000/api/v1
Staging: https://staging-api.elderguardian.ai/api/v1
```

### 1.2 Authentication & Authorization (Bearer JWT)
- **Mechanism:** Stateless RFC 7519 JSON Web Tokens (JWT) signed using RS256 (Asymmetric RSA-SHA256 with 4096-bit private key).
- **Header Format:**
  ```http
  Authorization: Bearer <access_token>
  ```
- **Token Specifications:**
  - **Access Token:** Short-lived (15 minutes expiry). Contains user identity, primary role, assigned patient/doctor/hospital IDs, and granular scope permissions.
  - **Refresh Token:** Long-lived (30 days expiry). Secure, opaque cryptographically random string (SHA-256 hashed in database with family-based reuse detection) or RS256 token. Delivered via `httpOnly`, `Secure`, `SameSite=Strict` cookie or JSON payload for mobile apps.
- **JWT Payload Schema:**
  ```typescript
  interface JWTPayload {
    sub: string;                // User UUID (e.g. "usr_01HJ8Z9X7K9Z02B1Q4W8D6E90F")
    email: string;              // User primary email address
    phone: string;              // Primary phone (+91 format)
    role: UserRole;             // 'PATIENT' | 'FAMILY_MEMBER' | 'DOCTOR' | 'HOSPITAL_ADMIN' | 'SUPER_ADMIN'
    patientId?: string;         // Present if role is PATIENT
    doctorId?: string;          // Present if role is DOCTOR
    hospitalId?: string;        // Present if role is DOCTOR or HOSPITAL_ADMIN
    familyMemberId?: string;    // Present if role is FAMILY_MEMBER
    permissions: string[];      // Granted permission claims (e.g. ["vitals:read", "prescriptions:write"])
    sessionId: string;          // Active session UUID for remote revocation
    iss: string;                // "elderguardian.ai"
    aud: string;                // "elderguardian-client"
    iat: number;                // Epoch timestamp (seconds)
    exp: number;                // Epoch timestamp (seconds, iat + 900)
    jti: string;                // Unique JWT ID for replay prevention
  }
  ```

### 1.3 Uniform Request & Response Envelopes
All API interactions enforce strict JSON payloads (`Content-Type: application/json; charset=utf-8`), except binary file uploads which use `multipart/form-data`.

#### Success Envelope (`JSend` compliant extension)
```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;          // ISO 8601 UTC timestamp
    requestId: string;          // Traceable UUID prefixed with "req_"
    pagination?: CursorPaginationMeta;
  };
}
```

#### Error Envelope
```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;               // Machine-readable uppercase snake_case error code
    message: string;            // Human-readable, client-safe error summary
    details?: Array<{           // Granular validation or domain errors
      field?: string;
      message: string;
      value?: any;
    }>;
  };
  meta: {
    timestamp: string;          // ISO 8601 UTC timestamp
    requestId: string;          // Distributed trace ID
  };
}
```

### 1.4 Cursor-Based Pagination Strategy
ElderGuardian AI records continuous real-time elder telemetry (heart rate, blood pressure, medication adherence logs). Traditional offset-based (`LIMIT`/`OFFSET`) pagination suffers from severe performance degradation ($O(N)$ row skips) and duplicate/skipped data when new records are inserted during browsing.

- **Request Query Parameters:**
  - `cursor`: Opaque, URL-safe Base64-encoded string containing the sorting tuple (e.g. `base64(createdAt:id)`).
  - `limit`: Integer, default `20`, maximum `100`.
  - `direction`: Enum `'next' | 'prev'` (default `'next'`).
- **Response Pagination Meta:**
  ```typescript
  interface CursorPaginationMeta {
    nextCursor: string | null;  // Cursor string to fetch the next page, null if end
    prevCursor: string | null;  // Cursor string to fetch previous page
    hasMore: boolean;           // True if additional records exist
    limit: number;              // Items requested per page
    totalCount?: number;        // Total matching items (optional for performance)
  }
  ```

### 1.5 Versioning & Deprecation Strategy
- **URI Path Versioning:** Embedded directly in the root path: `/api/v1`.
- **Breaking Changes:** Require incrementing the major version: `/api/v2`.
- **Non-breaking Additions:** New fields, optional query parameters, or new endpoints are released within `/api/v1` without disruption.
- **Deprecation Lifecycle:** Deprecated endpoints are announced 180 days prior to retirement and include standard IETF deprecation headers:
  ```http
  Deprecation: @1764547200
  Sunset: Wed, 01 Dec 2027 00:00:00 GMT
  Link: </api/v2/prescriptions>; rel="successor-version"
  ```

### 1.6 Rate Limiting Headers & Policies
Implemented using Redis sliding-window token bucket algorithm with standard IETF draft headers:

| Header | Description | Example |
| :--- | :--- | :--- |
| `RateLimit-Limit` | Maximum quota for current time window | `120` |
| `RateLimit-Remaining` | Remaining requests allowed in window | `84` |
| `RateLimit-Reset` | Seconds until quota resets | `26` |
| `Retry-After` | Returned on HTTP `429 Too Many Requests` (seconds) | `60` |

#### Rate Limit Tiers:
- **Public / Unauthenticated:** 30 req/min per IP address.
- **Authentication Endpoints (`/auth/login`, `/auth/register`):** 5 req/min per IP / email (Brute-force protection).
- **Patient / Family Web & Mobile Clients:** 120 req/min per authenticated user.
- **Doctor Clinical Workstations:** 300 req/min per authenticated clinician.
- **IoT & Health Reading Ingestion Endpoints:** 600 req/min per registered gateway device.

---

## 2. AUTHENTICATION ENDPOINTS

### 2.1 Register New User
- **Method / Path:** `POST /api/v1/auth/register`
- **Description:** Registers a new account as a Patient, Family Member, or Doctor. Triggers verification OTP/email and initializes role profile.
- **Authentication:** Public (None)
- **Authorized Roles:** Any
- **Request Body:**
  ```typescript
  interface RegisterRequest {
    fullName: string;                           // e.g. "Rameshwar Prasad Sharma"
    email: string;                              // e.g. "rameshwar.sharma@gmail.com"
    phone: string;                              // e.g. "+919876543210" (E.164 format)
    password: string;                           // Min 8 chars, 1 uppercase, 1 special char
    role: 'PATIENT' | 'FAMILY_MEMBER' | 'DOCTOR';
    dateOfBirth?: string;                       // "1954-08-15" (Required for PATIENT)
    gender?: 'MALE' | 'FEMALE' | 'OTHER';       // Required for PATIENT
    bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    emergencyContactPhone?: string;             // "+919811223344"
    medicalRegistrationNumber?: string;         // Required if role === 'DOCTOR' (e.g. "MCI-54321")
  }
  ```
- **Response Body (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_01HJ8Z9X7K9Z02B1Q4W8D6E90F",
        "fullName": "Rameshwar Prasad Sharma",
        "email": "rameshwar.sharma@gmail.com",
        "phone": "+919876543210",
        "role": "PATIENT",
        "isEmailVerified": false,
        "isPhoneVerified": false,
        "createdAt": "2026-11-23T14:30:00.000Z"
      },
      "verificationSent": {
        "channel": "EMAIL_AND_SMS",
        "expiresInSeconds": 600
      }
    },
    "meta": {
      "timestamp": "2026-11-23T14:30:00.120Z",
      "requestId": "req_01HJ8Z9X7K9Z02B1Q4W8D6E90F"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `VALIDATION_FAILED`, `INVALID_PHONE_FORMAT`, `WEAK_PASSWORD`
  - `409 Conflict`: `EMAIL_ALREADY_EXISTS`, `PHONE_ALREADY_EXISTS`, `REGISTRATION_NUMBER_EXISTS`
  - `429 Too Many Requests`: `RATE_LIMIT_EXCEEDED`

---

### 2.2 Login User
- **Method / Path:** `POST /api/v1/auth/login`
- **Description:** Authenticates credentials (email or phone + password), creates an active session, records device fingerprint, and returns JWT tokens.
- **Authentication:** Public (None)
- **Authorized Roles:** Any
- **Request Body:**
  ```typescript
  interface LoginRequest {
    identifier: string;                         // Email ("rameshwar.sharma@gmail.com") OR Phone ("+919876543210")
    password: string;
    deviceFingerprint?: string;                 // Device UUID / User Agent hash
    fcmToken?: string;                          // Firebase Cloud Messaging token for Push Notifications
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "tokens": {
        "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMDFISjhaOVg3SzlaMDJCMVE0VzhENkU5MEYiLCJyb2xlIjoiUEFUSUVOVCIsInBhdGllbnRJZCI6InBhdF8wMUhKOFpB...",
        "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMDFISjhaOVg3SzlaMDJCMVE0VzhENkU5MEYiLCJqdGkiOiJyZWZfMDFFRjEyMyIsImV4cCI6MTc2NzIwMDAwMH0...",
        "tokenType": "Bearer",
        "expiresIn": 900
      },
      "user": {
        "id": "usr_01HJ8Z9X7K9Z02B1Q4W8D6E90F",
        "fullName": "Rameshwar Prasad Sharma",
        "email": "rameshwar.sharma@gmail.com",
        "phone": "+919876543210",
        "role": "PATIENT",
        "patientProfileId": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
        "isEmailVerified": true,
        "isPhoneVerified": true,
        "profilePictureUrl": "https://cdn.elderguardian.ai/avatars/rameshwar_sharma.jpg"
      }
    },
    "meta": {
      "timestamp": "2026-11-23T14:31:10.045Z",
      "requestId": "req_01HJ8ZA118K8N1V7R3X9M2L0P4"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `VALIDATION_FAILED`
  - `401 Unauthorized`: `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`
  - `403 Forbidden`: `ACCOUNT_SUSPENDED`, `UNVERIFIED_EMAIL`
  - `429 Too Many Requests`: `AUTH_BRUTE_FORCE_TRIGGERED`

---

### 2.3 Refresh Access Token
- **Method / Path:** `POST /api/v1/auth/refresh-token`
- **Description:** Exchanges a valid refresh token for a newly issued access token and rotates the refresh token (Refresh Token Rotation with replay prevention).
- **Authentication:** Public (Valid Refresh Token in Body or Cookie)
- **Authorized Roles:** Any
- **Request Body:**
  ```typescript
  interface RefreshTokenRequest {
    refreshToken: string;                       // The current active refresh token
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMDFISjhaOVg3SzlaMDJCMVE0VzhENkU5MEYiLCJyb2xlIjoiUEFUSUVOVCIsImV4cCI6MTc2NDU0ODEwMH0...",
      "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMDFISjhaOVg3SzlaMDJCMVE0VzhENkU5MEYiLCJqdGkiOiJyZWZfMDJGQzk4NyIsImV4cCI6MTc2NzIwMDAwMH0...",
      "tokenType": "Bearer",
      "expiresIn": 900
    },
    "meta": {
      "timestamp": "2026-11-23T14:45:00.012Z",
      "requestId": "req_01HJ8ZBW93K2N4X8P7R1M5T9L2"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `TOKEN_MISSING`
  - `401 Unauthorized`: `REFRESH_TOKEN_EXPIRED`, `INVALID_REFRESH_TOKEN`, `TOKEN_REUSE_DETECTED` (revokes entire token family)

---

### 2.4 Forgot Password
- **Method / Path:** `POST /api/v1/auth/forgot-password`
- **Description:** Sends a secure 6-digit OTP or signed reset link to the user's verified phone/email for self-service password recovery.
- **Authentication:** Public (None)
- **Authorized Roles:** Any
- **Request Body:**
  ```typescript
  interface ForgotPasswordRequest {
    identifier: string;                         // e.g. "rameshwar.sharma@gmail.com" OR "+919876543210"
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "If an account exists with the provided identifier, password reset instructions have been dispatched.",
      "deliveryChannel": "SMS_AND_EMAIL",
      "maskedTarget": "r******a@gmail.com / +91******3210",
      "expiresInSeconds": 600
    },
    "meta": {
      "timestamp": "2026-11-23T14:46:12.890Z",
      "requestId": "req_01HJ8ZCX45K9M2L7R1V3P8Q5N6"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `INVALID_IDENTIFIER_FORMAT`
  - `429 Too Many Requests`: `OTP_RATE_LIMIT_EXCEEDED`

---

### 2.5 Reset Password
- **Method / Path:** `POST /api/v1/auth/reset-password`
- **Description:** Verifies the reset token/OTP and sets the user's new secure password, invalidating all existing active sessions.
- **Authentication:** Public (None)
- **Authorized Roles:** Any
- **Request Body:**
  ```typescript
  interface ResetPasswordRequest {
    identifier: string;                         // "rameshwar.sharma@gmail.com"
    resetToken: string;                         // 6-digit OTP or cryptographically signed token
    newPassword: string;                        // Minimum 8 characters with strength requirements
    confirmPassword: string;
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Password successfully reset. Please log in with your new credentials."
    },
    "meta": {
      "timestamp": "2026-11-23T14:48:30.104Z",
      "requestId": "req_01HJ8ZD832K1N9X4P7L2M5R8Q1"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `PASSWORDS_DO_NOT_MATCH`, `WEAK_PASSWORD`, `INVALID_OR_EXPIRED_TOKEN`
  - `404 Not Found`: `USER_NOT_FOUND`

---

### 2.6 Verify Email
- **Method / Path:** `POST /api/v1/auth/verify-email`
- **Description:** Confirms user email ownership using the verification token sent during registration or profile update.
- **Authentication:** Public (None)
- **Authorized Roles:** Any
- **Request Body:**
  ```typescript
  interface VerifyEmailRequest {
    token: string;                              // Verification token from email link or 6-digit OTP
    email: string;                              // "rameshwar.sharma@gmail.com"
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "isEmailVerified": true,
      "email": "rameshwar.sharma@gmail.com",
      "verifiedAt": "2026-11-23T14:50:00.000Z"
    },
    "meta": {
      "timestamp": "2026-11-23T14:50:00.210Z",
      "requestId": "req_01HJ8ZE289K3M1V8R4X7P2L9N0"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `INVALID_VERIFICATION_TOKEN`, `TOKEN_EXPIRED`
  - `404 Not Found`: `USER_NOT_FOUND`
  - `409 Conflict`: `EMAIL_ALREADY_VERIFIED`

---

### 2.7 Logout User
- **Method / Path:** `POST /api/v1/auth/logout`
- **Description:** Invalidates the provided refresh token and current session in Redis blacklist. Clears session cookies.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`
- **Request Body:**
  ```typescript
  interface LogoutRequest {
    refreshToken: string;                       // The refresh token to revoke
    allDevices?: boolean;                       // If true, terminates all active user sessions
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "User session logged out successfully."
    },
    "meta": {
      "timestamp": "2026-11-23T14:51:15.512Z",
      "requestId": "req_01HJ8ZEP12K4N8X3P9L1M7R6Q5"
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`, `TOKEN_REVOKED`


---

## 3. PATIENT ENDPOINTS

### 3.1 Get Current Patient Profile
- **Method / Path:** `GET /api/v1/patients/me`
- **Description:** Retrieves the authenticated patient's comprehensive personal, medical, ABHA (Ayushman Bharat Health Account), and emergency profile.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT` (or `FAMILY_MEMBER` with delegated patient context header `X-Patient-Context`)
- **Request Parameters:** None
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
      "userId": "usr_01HJ8Z9X7K9Z02B1Q4W8D6E90F",
      "abhaId": "91-4567-8901-2345",
      "abhaAddress": "rameshwar.sharma@abdm",
      "fullName": "Rameshwar Prasad Sharma",
      "dateOfBirth": "1954-08-15",
      "age": 72,
      "gender": "MALE",
      "bloodGroup": "B+",
      "primaryLanguage": "Hindi",
      "secondaryLanguages": ["English", "Kannada"],
      "address": {
        "line1": "Flat 402, Shanti Nilayam Apartments",
        "line2": "14th Main, 4th Block, Jayanagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560011",
        "country": "India",
        "coordinates": {
          "latitude": 12.9299,
          "longitude": 77.5824
        }
      },
      "emergencyContacts": [
        {
          "id": "emc_01HJ8ZF21A9X2M4K8L7R6Q5W01",
          "name": "Rahul Sharma",
          "relationship": "SON",
          "phone": "+919876543211",
          "email": "rahul.sharma@techcorp.in",
          "isPrimary": true,
          "address": "Indiranagar, Bengaluru"
        },
        {
          "id": "emc_01HJ8ZF21A9X2M4K8L7R6Q5W02",
          "name": "Priya Sharma Nair",
          "relationship": "DAUGHTER",
          "phone": "+919876543212",
          "email": "priya.nair@healthnet.com",
          "isPrimary": false,
          "address": "Koramangala, Bengaluru"
        }
      ],
      "clinicalProfile": {
        "chronicConditions": [
          { "condition": "Type 2 Diabetes Mellitus", "diagnosedYear": 2011, "icd10": "E11.9" },
          { "condition": "Essential Hypertension", "diagnosedYear": 2015, "icd10": "I10" },
          { "condition": "Bilateral Knee Osteoarthritis", "diagnosedYear": 2019, "icd10": "M17.0" }
        ],
        "allergies": [
          { "allergen": "Sulfa Antibiotics (Sulfonamides)", "severity": "SEVERE", "reaction": "Cutaneous Rash & Angioedema" },
          { "allergen": "Dust Mites", "severity": "MILD", "reaction": "Allergic Rhinitis" }
        ],
        "dietaryPreferences": "VEGETARIAN",
        "mobilityStatus": "ASSISTED_WALKER",
        "fallRiskScore": "MODERATE"
      },
      "primaryPhysician": {
        "id": "doc_01HJ8ZGK7M4N2P9Q5R1L8W3X04",
        "name": "Dr. Rajesh Iyer",
        "specialization": "Cardiology & Internal Medicine",
        "hospital": "Apollo Hospitals, Bannerghatta Road, Bengaluru"
      },
      "createdAt": "2026-01-10T10:00:00.000Z",
      "updatedAt": "2026-11-20T08:15:00.000Z"
    },
    "meta": {
      "timestamp": "2026-11-23T14:52:00.010Z",
      "requestId": "req_01HJ8ZF588M2K1V9R7X4P3L8N2"
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`
  - `403 Forbidden`: `FORBIDDEN_RESOURCE`
  - `404 Not Found`: `PATIENT_PROFILE_NOT_FOUND`

---

### 3.2 Update Patient Profile
- **Method / Path:** `PUT /api/v1/patients/me`
- **Description:** Updates the patient's personal, demographic, address, emergency contact, or mobility details.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER` (with `caregiver:write` grant)
- **Request Body:**
  ```typescript
  interface UpdatePatientProfileRequest {
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      coordinates?: { latitude: number; longitude: number };
    };
    emergencyContacts?: Array<{
      name: string;
      relationship: 'SPOUSE' | 'SON' | 'DAUGHTER' | 'SIBLING' | 'NEIGHBOR' | 'CARETAKER' | 'OTHER';
      phone: string;
      email?: string;
      isPrimary: boolean;
      address?: string;
    }>;
    dietaryPreferences?: 'VEGETARIAN' | 'NON_VEGETARIAN' | 'EGGETARIAN' | 'VEGAN' | 'JAIN';
    mobilityStatus?: 'INDEPENDENT' | 'CANE' | 'ASSISTED_WALKER' | 'WHEELCHAIR' | 'BEDRIDDEN';
    primaryLanguage?: string;
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
      "updatedFields": ["address", "mobilityStatus"],
      "mobilityStatus": "ASSISTED_WALKER",
      "updatedAt": "2026-11-23T14:55:00.000Z"
    },
    "meta": {
      "timestamp": "2026-11-23T14:55:00.080Z",
      "requestId": "req_01HJ8ZG321M9K4V1R2X8P7L5N3"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `VALIDATION_FAILED`, `INVALID_PINCODE`
  - `401 Unauthorized`: `UNAUTHORIZED`
  - `403 Forbidden`: `INSUFFICIENT_PERMISSIONS`

---

### 3.3 List Family Members Linked to Patient
- **Method / Path:** `GET /api/v1/patients/me/family-members`
- **Description:** Retrieves all family members/caregivers linked to this patient's profile along with their relationship and access authorization levels.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`
- **Query Parameters:** None
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "familyMembers": [
        {
          "linkId": "lnk_01HJ8ZH987M2K3N4P1L5R8W9Q0",
          "familyMemberUserId": "usr_01HJ8ZJ112N4M8X3P7L1R5Q2W9",
          "name": "Rahul Sharma",
          "relationship": "SON",
          "phone": "+919876543211",
          "email": "rahul.sharma@techcorp.in",
          "accessLevel": "FULL_ACCESS",
          "status": "ACTIVE",
          "canOrderRefills": true,
          "canBookAppointments": true,
          "canViewMedicalRecords": true,
          "receiveEmergencySms": true,
          "linkedSince": "2026-01-15T09:30:00.000Z"
        },
        {
          "linkId": "lnk_01HJ8ZH987M2K3N4P1L5R8W9Q1",
          "familyMemberUserId": "usr_01HJ8ZJ556N9M1X8P4L2R7Q8W3",
          "name": "Priya Sharma Nair",
          "relationship": "DAUGHTER",
          "phone": "+919876543212",
          "email": "priya.nair@healthnet.com",
          "accessLevel": "READ_ONLY",
          "status": "ACTIVE",
          "canOrderRefills": false,
          "canBookAppointments": true,
          "canViewMedicalRecords": true,
          "receiveEmergencySms": true,
          "linkedSince": "2026-02-01T14:00:00.000Z"
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T14:56:10.025Z",
      "requestId": "req_01HJ8ZH990M1K2V8R3X7P4L9N1"
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`
  - `404 Not Found`: `PATIENT_NOT_FOUND`

---

### 3.4 Invite / Link Family Member
- **Method / Path:** `POST /api/v1/patients/me/family-members`
- **Description:** Invites an adult family member or caregiver by phone/email to monitor the elder, specifying granular caregiving permissions.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`
- **Request Body:**
  ```typescript
  interface LinkFamilyMemberRequest {
    name: string;                               // "Suresh Sharma"
    phone: string;                              // "+919822334455"
    email?: string;                             // "suresh.sharma@gmail.com"
    relationship: 'SPOUSE' | 'SON' | 'DAUGHTER' | 'BROTHER' | 'SISTER' | 'CARETAKER' | 'OTHER';
    accessLevel: 'FULL_ACCESS' | 'READ_ONLY' | 'EMERGENCY_ONLY';
    permissions: {
      canOrderRefills: boolean;
      canBookAppointments: boolean;
      canViewMedicalRecords: boolean;
      receiveEmergencySms: boolean;
      receiveDailyAdherenceReports: boolean;
    };
  }
  ```
- **Response Body (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "invitationId": "inv_01HJ8ZK432M8N1P4R7L9W2Q5X6",
      "name": "Suresh Sharma",
      "phone": "+919822334455",
      "relationship": "BROTHER",
      "accessLevel": "READ_ONLY",
      "invitationStatus": "PENDING_VERIFICATION",
      "expiresAt": "2026-11-30T14:58:00.000Z"
    },
    "meta": {
      "timestamp": "2026-11-23T14:58:00.045Z",
      "requestId": "req_01HJ8ZK435M1K9V2R4X8P1L7N8"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `VALIDATION_FAILED`, `CANNOT_LINK_SELF`
  - `409 Conflict`: `FAMILY_MEMBER_ALREADY_LINKED`

---

### 3.5 Manage Consent for Medical Records (ABDM Compliant)
- **Method / Path:** `POST /api/v1/patients/me/consents`
- **Description:** Grants, modifies, or revokes digital clinical consent for hospitals, doctors, or caregivers in compliance with ABDM guidelines.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`
- **Request Body:**
  ```typescript
  interface ManageConsentRequest {
    granteeId: string;                          // Doctor ID ("doc_01HJ8ZGK7M4N2P9Q5R1L8W3X04") or Hospital ID
    granteeType: 'DOCTOR' | 'HOSPITAL' | 'FAMILY_MEMBER';
    purpose: 'CARE_MANAGEMENT' | 'EMERGENCY_ACCESS' | 'SECOND_OPINION' | 'TELECONSULTATION';
    dataTypes: Array<'PRESCRIPTIONS' | 'DIAGNOSTIC_REPORTS' | 'VITALS_HISTORY' | 'MEDICATION_LOGS'>;
    action: 'GRANT' | 'REVOKE' | 'UPDATE';
    validUntil: string;                         // ISO 8601 string, e.g. "2027-11-23T23:59:59.000Z"
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "consentArtifactId": "cst_01HJ8ZM112M4N9P7R3L1W8Q2X5",
      "status": "GRANTED",
      "granteeId": "doc_01HJ8ZGK7M4N2P9Q5R1L8W3X04",
      "granteeName": "Dr. Rajesh Iyer",
      "dataTypes": ["PRESCRIPTIONS", "DIAGNOSTIC_REPORTS", "VITALS_HISTORY", "MEDICATION_LOGS"],
      "grantedAt": "2026-11-23T15:00:00.000Z",
      "validUntil": "2027-11-23T23:59:59.000Z"
    },
    "meta": {
      "timestamp": "2026-11-23T15:00:00.035Z",
      "requestId": "req_01HJ8ZM114M2K8V1R9X4P6L3N7"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `INVALID_EXPIRY_DATE`, `UNKNOWN_GRANTEE`
  - `404 Not Found`: `GRANTEE_NOT_FOUND`

---

### 3.6 Get Patient Health Summary (AI-Aggregated Overview)
- **Method / Path:** `GET /api/v1/patients/me/health-summary`
- **Description:** Generates an AI-synthesized consolidated clinical summary: latest vital readings, today's medication adherence, active risk score, and upcoming alerts.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR` (with active consent)
- **Query Parameters:** None
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "patientName": "Rameshwar Prasad Sharma",
      "age": 72,
      "healthScore": 88,
      "riskStatus": "STABLE",
      "latestVitals": {
        "bloodPressure": {
          "systolic": 128,
          "diastolic": 82,
          "unit": "mmHg",
          "status": "NORMAL",
          "recordedAt": "2026-11-23T08:00:00.000Z"
        },
        "bloodGlucose": {
          "value": 134,
          "unit": "mg/dL",
          "type": "FASTING",
          "status": "ELEVATED",
          "recordedAt": "2026-11-23T07:30:00.000Z"
        },
        "heartRate": {
          "value": 74,
          "unit": "bpm",
          "status": "NORMAL",
          "recordedAt": "2026-11-23T08:00:00.000Z"
        },
        "spO2": {
          "value": 98,
          "unit": "%",
          "status": "OPTIMAL",
          "recordedAt": "2026-11-23T08:00:00.000Z"
        }
      },
      "todayMedicationSummary": {
        "totalScheduled": 5,
        "taken": 3,
        "missed": 0,
        "skipped": 0,
        "pending": 2,
        "adherenceRatePercentage": 100.0
      },
      "upcomingAppointment": {
        "appointmentId": "apt_01HJ8ZN543M1N8P2R9L4W7Q1X3",
        "doctorName": "Dr. Rajesh Iyer",
        "specialization": "Cardiology",
        "hospitalName": "Apollo Hospitals, Bannerghatta Road",
        "scheduledTime": "2026-11-25T10:30:00.000Z",
        "mode": "IN_PERSON"
      },
      "criticalAlertsCount": 0,
      "aiCareRecommendations": [
        "Fasting blood glucose is mildly elevated (134 mg/dL). Maintain morning 20-minute gentle walker routine.",
        "Telmisartan 40mg inventory is down to 4 days supply. Automated refill prediction active."
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:02:10.050Z",
      "requestId": "req_01HJ8ZN545M9K3V7R1X2P8L4N9"
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`
  - `403 Forbidden`: `CONSENT_REQUIRED_OR_EXPIRED`
  - `404 Not Found`: `PATIENT_NOT_FOUND`

---

## 4. HOSPITAL & DOCTOR ENDPOINTS

### 4.1 Search and Filter Hospitals
- **Method / Path:** `GET /api/v1/hospitals`
- **Description:** Lists partner hospitals, medical institutions, and specialty clinics with geospatial, accreditation, and specialty filters.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** Any authenticated user
- **Query Parameters:**
  ```typescript
  interface HospitalSearchParams {
    query?: string;                             // e.g. "Apollo" or "Fortis"
    city?: string;                              // e.g. "Bengaluru", "New Delhi", "Mumbai"
    state?: string;                             // e.g. "Karnataka"
    specialty?: string;                         // e.g. "Geriatrics", "Cardiology", "Neurology"
    hasEmergencyServices?: boolean;             // true
    accreditation?: 'NABH' | 'JCI' | 'NABL';
    cursor?: string;
    limit?: number;                             // Default 20, Max 100
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "hospitals": [
        {
          "id": "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2",
          "name": "Apollo Hospitals, Bannerghatta Road",
          "network": "Apollo Hospitals Enterprise Ltd.",
          "address": "154/11, Opp. IIMB, Bannerghatta Road",
          "city": "Bengaluru",
          "state": "Karnataka",
          "pincode": "560076",
          "coordinates": { "latitude": 12.8954, "longitude": 77.5986 },
          "phone": "+918026304050",
          "emergencyHotline": "+91801066",
          "accreditations": ["NABH", "JCI"],
          "hasGeriatricCareUnit": true,
          "has24x7Emergency": true,
          "bedCount": 250,
          "rating": 4.8,
          "reviewCount": 1240
        },
        {
          "id": "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X3",
          "name": "Manipal Hospital Whitefield",
          "network": "Manipal Health Enterprises",
          "address": "ITPL Main Road, KIADB Export Promotion Industrial Area, Whitefield",
          "city": "Bengaluru",
          "state": "Karnataka",
          "pincode": "560066",
          "coordinates": { "latitude": 12.9868, "longitude": 77.7314 },
          "phone": "+918025024444",
          "emergencyHotline": "+918025024445",
          "accreditations": ["NABH"],
          "hasGeriatricCareUnit": true,
          "has24x7Emergency": true,
          "bedCount": 280,
          "rating": 4.7,
          "reviewCount": 980
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:05:00.000Z",
      "requestId": "req_01HJ8ZP880M4K1V2R8X9P3L7N1",
      "pagination": {
        "nextCursor": "ZXlKaWRIa2lPaUptY0h...",
        "prevCursor": null,
        "hasMore": false,
        "limit": 20,
        "totalCount": 2
      }
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `INVALID_QUERY_PARAMETER`
  - `401 Unauthorized`: `UNAUTHORIZED`

---

### 4.2 Get Hospital Details by ID
- **Method / Path:** `GET /api/v1/hospitals/:id`
- **Description:** Retrieves deep details of a specific hospital, including OPD departments, elderly amenities (wheelchair accessibility, senior lounge), and nodal officers.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** Any authenticated user
- **Path Parameters:**
  - `id`: Hospital UUID (`hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2`)
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2",
      "name": "Apollo Hospitals, Bannerghatta Road",
      "address": {
        "line1": "154/11, Opposite IIM-B",
        "line2": "Bannerghatta Main Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560076",
        "country": "India"
      },
      "departments": [
        "Cardiology & Cardio-Thoracic Surgery",
        "Geriatric Medicine",
        "Endocrinology & Diabetology",
        "Neurology",
        "Orthopaedics & Joint Replacement",
        "Nephrology"
      ],
      "elderlyCareAmenities": [
        "Dedicated Senior Citizen Priority OPD Desk",
        "Motorized Wheelchair Assistance at Entrance",
        "On-site Diagnostic Home Sample Collection",
        "Ambulance GPS Dispatch Integrated with ElderGuardian SOS"
      ],
      "emergencyHotline": "+91801066",
      "receptionPhone": "+918026304050",
      "opdTimings": "Monday to Saturday: 08:00 AM - 08:00 PM, Sunday: Emergency Only",
      "isActivePartner": true
    },
    "meta": {
      "timestamp": "2026-11-23T15:06:00.015Z",
      "requestId": "req_01HJ8ZQ214M8K9V4R2X1P5L8N3"
    }
  }
  ```
- **Error Codes:**
  - `404 Not Found`: `HOSPITAL_NOT_FOUND`

---

### 4.3 Get Doctors Affiliated with Hospital
- **Method / Path:** `GET /api/v1/hospitals/:id/doctors`
- **Description:** Returns a list of certified doctors practicing at the specified hospital, filterable by department.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** Any authenticated user
- **Path Parameters:**
  - `id`: Hospital UUID
- **Query Parameters:**
  - `department?: string`
  - `cursor?: string`
  - `limit?: number`
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "hospitalId": "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2",
      "hospitalName": "Apollo Hospitals, Bannerghatta Road",
      "doctors": [
        {
          "id": "doc_01HJ8ZGK7M4N2P9Q5R1L8W3X04",
          "name": "Dr. Rajesh Iyer",
          "registrationNumber": "KMC-48291",
          "qualification": "MBBS, MD (Internal Medicine), DM (Cardiology), FACC",
          "designation": "Director & Senior Consultant - Interventional Cardiology",
          "experienceYears": 24,
          "opdDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
          "consultationFee": { "amount": 1200, "currency": "INR" },
          "nextAvailableSlot": "2026-11-25T10:30:00.000Z",
          "rating": 4.9
        },
        {
          "id": "doc_01HJ8ZGK7M4N2P9Q5R1L8W3X05",
          "name": "Dr. Ananya Mukherjee",
          "registrationNumber": "KMC-61204",
          "qualification": "MBBS, MD (Geriatric Medicine - AIIMS New Delhi)",
          "designation": "Lead Consultant - Geriatric & Palliative Care",
          "experienceYears": 16,
          "opdDays": ["TUESDAY", "THURSDAY", "SATURDAY"],
          "consultationFee": { "amount": 1000, "currency": "INR" },
          "nextAvailableSlot": "2026-11-24T11:00:00.000Z",
          "rating": 4.95
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:07:00.025Z",
      "requestId": "req_01HJ8ZQ875M2K7V9R1X4P6L2N5",
      "pagination": { "nextCursor": null, "prevCursor": null, "hasMore": false, "limit": 20 }
    }
  }
  ```
- **Error Codes:**
  - `404 Not Found`: `HOSPITAL_NOT_FOUND`

---

### 4.4 Search Doctors Across Network
- **Method / Path:** `GET /api/v1/doctors`
- **Description:** Search registered doctors across all hospitals and teleconsult clinics by medical specialization, city, languages, and fees.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** Any authenticated user
- **Query Parameters:**
  ```typescript
  interface DoctorSearchParams {
    query?: string;                             // e.g. "Rajesh" or "Cardiology"
    specialization?: string;                    // "Cardiology", "Geriatric Medicine", "Diabetology"
    city?: string;                              // "Bengaluru", "Delhi NCR", "Mumbai"
    teleconsultAvailable?: boolean;             // true
    language?: string;                          // "Hindi", "English", "Kannada", "Tamil"
    maxFee?: number;                            // in INR (e.g. 1500)
    cursor?: string;
    limit?: number;
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "doctors": [
        {
          "id": "doc_01HJ8ZGK7M4N2P9Q5R1L8W3X04",
          "name": "Dr. Rajesh Iyer",
          "specialization": "Cardiology",
          "qualification": "MBBS, MD, DM (Cardiology)",
          "experienceYears": 24,
          "languages": ["English", "Hindi", "Tamil", "Kannada"],
          "primaryHospital": {
            "id": "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2",
            "name": "Apollo Hospitals, Bannerghatta Road",
            "city": "Bengaluru"
          },
          "supportsTeleconsult": true,
          "consultationFee": { "inPerson": 1200, "video": 900, "currency": "INR" },
          "rating": 4.9,
          "totalPatientReviews": 420
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:08:10.010Z",
      "requestId": "req_01HJ8ZR123M9K4V2R8X1P3L7N0",
      "pagination": { "nextCursor": null, "prevCursor": null, "hasMore": false, "limit": 20 }
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `INVALID_SEARCH_PARAMETERS`

---

### 4.5 Get Doctor Profile by ID
- **Method / Path:** `GET /api/v1/doctors/:id`
- **Description:** Fetches complete clinical profile, medical license verification status (NMC / State Council), affiliations, bio, and patient feedback.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** Any authenticated user
- **Path Parameters:**
  - `id`: Doctor UUID
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "doc_01HJ8ZGK7M4N2P9Q5R1L8W3X04",
      "name": "Dr. Rajesh Iyer",
      "avatarUrl": "https://cdn.elderguardian.ai/doctors/dr_rajesh_iyer.jpg",
      "registrationNumber": "KMC-48291",
      "medicalCouncil": "Karnataka Medical Council",
      "specialization": "Cardiology",
      "subSpecialties": ["Preventive Cardiology", "Heart Failure Management in Geriatrics"],
      "bio": "Dr. Rajesh Iyer is a distinguished cardiologist with 24 years of clinical experience specializing in cardiovascular health in elderly patients and lifestyle disease reversal.",
      "qualifications": [
        { "degree": "MBBS", "institution": "Madras Medical College", "year": 1998 },
        { "degree": "MD - Internal Medicine", "institution": "AIIMS New Delhi", "year": 2002 },
        { "degree": "DM - Cardiology", "institution": "Sri Jayadeva Institute of Cardiovascular Sciences", "year": 2006 }
      ],
      "hospitalAffiliations": [
        {
          "hospitalId": "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2",
          "name": "Apollo Hospitals, Bannerghatta Road",
          "designation": "Director & Senior Consultant"
        }
      ],
      "teleconsultAvailable": true,
      "pricing": {
        "inPersonConsultationINR": 1200,
        "videoConsultationINR": 900
      }
    },
    "meta": {
      "timestamp": "2026-11-23T15:09:20.020Z",
      "requestId": "req_01HJ8ZR871M1K2V9R4X8P5L3N6"
    }
  }
  ```
- **Error Codes:**
  - `404 Not Found`: `DOCTOR_NOT_FOUND`

---

### 4.6 Get Doctor Slot Availability
- **Method / Path:** `GET /api/v1/doctors/:id/availability`
- **Description:** Returns bookable time slots for in-person and video consultations over a specified date range.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** Any authenticated user
- **Path Parameters:**
  - `id`: Doctor UUID
- **Query Parameters:**
  ```typescript
  interface AvailabilityQueryParams {
    dateFrom: string;                           // "2026-11-25" (YYYY-MM-DD)
    dateTo: string;                             // "2026-11-27"
    consultationType?: 'IN_PERSON' | 'VIDEO';   // Default both
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "doctorId": "doc_01HJ8ZGK7M4N2P9Q5R1L8W3X04",
      "doctorName": "Dr. Rajesh Iyer",
      "availableDays": [
        {
          "date": "2026-11-25",
          "slots": [
            {
              "slotId": "slt_01HJ8ZS234M8N1P9R2L4W7Q1X0",
              "startTime": "2026-11-25T10:00:00.000Z",
              "endTime": "2026-11-25T10:30:00.000Z",
              "consultationType": "IN_PERSON",
              "hospitalId": "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2",
              "status": "AVAILABLE"
            },
            {
              "slotId": "slt_01HJ8ZS234M8N1P9R2L4W7Q1X1",
              "startTime": "2026-11-25T10:30:00.000Z",
              "endTime": "2026-11-25T11:00:00.000Z",
              "consultationType": "IN_PERSON",
              "hospitalId": "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2",
              "status": "AVAILABLE"
            },
            {
              "slotId": "slt_01HJ8ZS234M8N1P9R2L4W7Q1X2",
              "startTime": "2026-11-25T15:00:00.000Z",
              "endTime": "2026-11-25T15:20:00.000Z",
              "consultationType": "VIDEO",
              "status": "AVAILABLE"
            }
          ]
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:10:00.035Z",
      "requestId": "req_01HJ8ZS456M2K8V3R1X9P7L4N2"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `INVALID_DATE_RANGE`, `DATE_IN_PAST`
  - `404 Not Found`: `DOCTOR_NOT_FOUND`


---

## 5. APPOINTMENT ENDPOINTS

### 5.1 Book a New Appointment
- **Method / Path:** `POST /api/v1/appointments`
- **Description:** Books an in-person OPD consultation or video consultation with a doctor. Integrates elder-friendly transport/wheelchair assistance request and sends SMS/WhatsApp confirmations to caregivers.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER` (for linked elder), `DOCTOR`
- **Request Body:**
  ```typescript
  interface BookAppointmentRequest {
    patientId: string;                          // "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3"
    doctorId: string;                           // "doc_01HJ8ZGK7M4N2P9Q5R1L8W3X04"
    hospitalId: string;                         // "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2"
    slotId: string;                             // "slt_01HJ8ZS234M8N1P9R2L4W7Q1X0"
    scheduledStartTime: string;                 // "2026-11-25T10:00:00.000Z"
    consultationType: 'IN_PERSON' | 'VIDEO';
    reasonForVisit: string;                     // "3-month Hypertension & Diabetes checkup; recurring knee pain"
    symptoms?: string[];                        // ["Knee stiffness in morning", "Mild headache"]
    elderAssistanceRequired?: {
      needsWheelchairAtEntrance: boolean;       // true
      accompaniedByCaregiver: boolean;          // true (Son Rahul Sharma)
      requiresCabPickupSupport: boolean;        // false
    };
    paymentMethod: 'PAY_AT_HOSPITAL' | 'UPI_RAZORPAY' | 'INSURANCE_TPA';
  }
  ```
- **Response Body (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "appointment": {
        "id": "apt_01HJ8ZT567M3N1P8R4L2W6Q9X0",
        "referenceNumber": "EG-20261125-9821",
        "patient": {
          "id": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
          "name": "Rameshwar Prasad Sharma",
          "phone": "+919876543210"
        },
        "doctor": {
          "id": "doc_01HJ8ZGK7M4N2P9Q5R1L8W3X04",
          "name": "Dr. Rajesh Iyer",
          "specialization": "Cardiology"
        },
        "hospital": {
          "id": "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2",
          "name": "Apollo Hospitals, Bannerghatta Road",
          "department": "Cardiology OPD Block B, 2nd Floor",
          "googleMapsUrl": "https://maps.google.com/?q=12.8954,77.5986"
        },
        "scheduledStartTime": "2026-11-25T10:00:00.000Z",
        "scheduledEndTime": "2026-11-25T10:30:00.000Z",
        "consultationType": "IN_PERSON",
        "status": "CONFIRMED",
        "elderAssistance": {
          "wheelchairAssistanceToken": "WC-BLR-042",
          "helpDeskContact": "+918026304050"
        },
        "paymentStatus": "PAYMENT_ON_ARRIVAL",
        "feeAmount": 1200,
        "currency": "INR",
        "createdAt": "2026-11-23T15:15:00.000Z"
      }
    },
    "meta": {
      "timestamp": "2026-11-23T15:15:00.120Z",
      "requestId": "req_01HJ8ZT570M1K8V2R4X9P3L7N5"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `VALIDATION_FAILED`, `SLOT_EXPIRED`
  - `409 Conflict`: `SLOT_ALREADY_BOOKED`, `PATIENT_DOUBLE_BOOKING`
  - `404 Not Found`: `DOCTOR_OR_SLOT_NOT_FOUND`

---

### 5.2 List Appointments with Filters
- **Method / Path:** `GET /api/v1/appointments`
- **Description:** Lists appointments for the logged-in patient or family member with status filtering, date range, and cursor pagination.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Query Parameters:**
  ```typescript
  interface ListAppointmentsQuery {
    patientId?: string;                         // Required if caller is FAMILY_MEMBER
    status?: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
    consultationType?: 'IN_PERSON' | 'VIDEO';
    startDate?: string;                         // "2026-11-01"
    endDate?: string;                           // "2026-11-30"
    cursor?: string;
    limit?: number;
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "appointments": [
        {
          "id": "apt_01HJ8ZT567M3N1P8R4L2W6Q9X0",
          "referenceNumber": "EG-20261125-9821",
          "doctorName": "Dr. Rajesh Iyer",
          "specialization": "Cardiology",
          "hospitalName": "Apollo Hospitals, Bannerghatta Road",
          "scheduledStartTime": "2026-11-25T10:00:00.000Z",
          "consultationType": "IN_PERSON",
          "status": "CONFIRMED"
        },
        {
          "id": "apt_01HJ8ZU123M9N4P2R1L8W3Q5X9",
          "referenceNumber": "EG-20260820-4102",
          "doctorName": "Dr. Ananya Mukherjee",
          "specialization": "Geriatric Medicine",
          "hospitalName": "Apollo Hospitals, Bannerghatta Road",
          "scheduledStartTime": "2026-08-20T11:00:00.000Z",
          "consultationType": "IN_PERSON",
          "status": "COMPLETED"
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:16:00.000Z",
      "requestId": "req_01HJ8ZU125M2K9V4R8X1P5L7N3",
      "pagination": {
        "nextCursor": null,
        "prevCursor": null,
        "hasMore": false,
        "limit": 20,
        "totalCount": 2
      }
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`
  - `403 Forbidden`: `CAREGIVER_ACCESS_DENIED`

---

### 5.3 Get Appointment Details by ID
- **Method / Path:** `GET /api/v1/appointments/:id`
- **Description:** Returns complete details for a specific appointment, including clinical pre-visit notes, Google Maps directions, wheelchair dispatch status, and prescription link.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`, `HOSPITAL_ADMIN`
- **Path Parameters:**
  - `id`: Appointment UUID
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "apt_01HJ8ZT567M3N1P8R4L2W6Q9X0",
      "referenceNumber": "EG-20261125-9821",
      "patient": {
        "id": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
        "name": "Rameshwar Prasad Sharma",
        "age": 72,
        "gender": "MALE",
        "bloodGroup": "B+"
      },
      "doctor": {
        "id": "doc_01HJ8ZGK7M4N2P9Q5R1L8W3X04",
        "name": "Dr. Rajesh Iyer",
        "specialization": "Cardiology",
        "phone": "+918026304050"
      },
      "hospital": {
        "id": "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2",
        "name": "Apollo Hospitals, Bannerghatta Road",
        "address": "154/11, Opp. IIMB, Bannerghatta Road, Bengaluru",
        "room": "OPD Consultation Room 204",
        "emergencyContact": "+91801066"
      },
      "scheduledStartTime": "2026-11-25T10:00:00.000Z",
      "scheduledEndTime": "2026-11-25T10:30:00.000Z",
      "consultationType": "IN_PERSON",
      "status": "CONFIRMED",
      "reasonForVisit": "3-month Hypertension & Diabetes checkup; recurring knee pain",
      "elderAssistance": {
        "needsWheelchairAtEntrance": true,
        "accompaniedByCaregiver": true,
        "caregiverName": "Rahul Sharma (+919876543211)"
      },
      "prescriptionId": null,
      "clinicalNotes": null,
      "feeAmount": 1200,
      "paymentStatus": "PENDING"
    },
    "meta": {
      "timestamp": "2026-11-23T15:17:15.010Z",
      "requestId": "req_01HJ8ZV234M1K8V9R4X2P7L5N8"
    }
  }
  ```
- **Error Codes:**
  - `404 Not Found`: `APPOINTMENT_NOT_FOUND`

---

### 5.4 Reschedule Appointment
- **Method / Path:** `PUT /api/v1/appointments/:id`
- **Description:** Reschedules an existing confirmed appointment to a new date/time slot, notifying doctor and caregivers.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Path Parameters:**
  - `id`: Appointment UUID
- **Request Body:**
  ```typescript
  interface RescheduleAppointmentRequest {
    newSlotId: string;                          // "slt_01HJ8ZS234M8N1P9R2L4W7Q1X1"
    newScheduledStartTime: string;              // "2026-11-26T11:00:00.000Z"
    rescheduleReason: string;                   // "Caregiver son has a travel conflict on Wednesday morning"
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "apt_01HJ8ZT567M3N1P8R4L2W6Q9X0",
      "status": "RESCHEDULED",
      "previousStartTime": "2026-11-25T10:00:00.000Z",
      "newStartTime": "2026-11-26T11:00:00.000Z",
      "rescheduledAt": "2026-11-23T15:18:00.000Z",
      "rescheduleReason": "Caregiver son has a travel conflict on Wednesday morning"
    },
    "meta": {
      "timestamp": "2026-11-23T15:18:00.045Z",
      "requestId": "req_01HJ8ZV891M3K4V2R8X1P9L4N0"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `CANNOT_RESCHEDULE_PAST_APPOINTMENT`
  - `409 Conflict`: `NEW_SLOT_ALREADY_BOOKED`

---

### 5.5 Cancel Appointment
- **Method / Path:** `POST /api/v1/appointments/:id/cancel`
- **Description:** Cancels an upcoming appointment, releases the doctor's calendar slot, and initiates refund if payment was pre-collected.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`, `HOSPITAL_ADMIN`
- **Path Parameters:**
  - `id`: Appointment UUID
- **Request Body:**
  ```typescript
  interface CancelAppointmentRequest {
    cancellationReason: string;                 // "Patient feeling feverish; advised home rest by family doctor"
    refundRequested?: boolean;                  // true if prepaid
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "apt_01HJ8ZT567M3N1P8R4L2W6Q9X0",
      "status": "CANCELLED",
      "cancelledAt": "2026-11-23T15:19:00.000Z",
      "cancellationReason": "Patient feeling feverish; advised home rest by family doctor",
      "refundStatus": "NO_PREPAYMENT_FOUND"
    },
    "meta": {
      "timestamp": "2026-11-23T15:19:00.035Z",
      "requestId": "req_01HJ8ZW345M9K1V8R4X7P2L6N1"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `APPOINTMENT_ALREADY_COMPLETED`, `CANCELLATION_WINDOW_EXPIRED`
  - `404 Not Found`: `APPOINTMENT_NOT_FOUND`

---

### 5.6 Get Next Upcoming Appointment
- **Method / Path:** `GET /api/v1/appointments/upcoming`
- **Description:** High-priority convenience endpoint for the elder home-screen widget showing the imminent medical appointment with countdown and preparation instructions.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`
- **Query Parameters:**
  - `patientId?: string` (Required if family member)
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "hasUpcoming": true,
      "appointment": {
        "id": "apt_01HJ8ZT567M3N1P8R4L2W6Q9X0",
        "doctorName": "Dr. Rajesh Iyer",
        "specialization": "Cardiology",
        "hospitalName": "Apollo Hospitals, Bannerghatta Road",
        "scheduledStartTime": "2026-11-25T10:00:00.000Z",
        "hoursRemaining": 42.75,
        "consultationType": "IN_PERSON",
        "preVisitInstructions": [
          "Please carry recent fasting blood sugar report and home BP logbook.",
          "Wheelchair assistance is pre-booked at Entrance Gate 2.",
          "Fast for 10 hours if fasting blood tests are planned by Dr. Iyer."
        ]
      }
    },
    "meta": {
      "timestamp": "2026-11-23T15:20:00.015Z",
      "requestId": "req_01HJ8ZX112M8K4V3R9X1P5L8N4"
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`

---

## 6. PRESCRIPTION ENDPOINTS

### 6.1 Upload Prescription Document (OCR & Entity Extraction)
- **Method / Path:** `POST /api/v1/prescriptions`
- **Description:** Uploads a physical paper prescription photo or PDF (e.g. from an Indian clinic), triggers OCR processing, and queues AI extraction of medications, dosages, and refill timelines.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Content-Type:** `multipart/form-data`
- **Form Data Fields:**
  - `file`: Binary (JPEG, PNG, or PDF, max 10MB)
  - `patientId`: String (`pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3`)
  - `doctorName`: String optional (e.g. "Dr. Rajesh Iyer")
  - `hospitalName`: String optional (e.g. "Apollo Hospitals")
  - `prescriptionDate`: String (`2026-11-23`)
  - `notes`: String optional ("Prescription issued during morning consultation")
- **Response Body (202 Accepted):**
  ```json
  {
    "success": true,
    "data": {
      "prescriptionId": "prx_01HJ8ZY654M1N8P9R4L2W7Q3X1",
      "fileUrl": "https://storage.elderguardian.ai/prescriptions/2026/11/prx_01HJ8ZY654.pdf",
      "ocrStatus": "PROCESSING",
      "estimatedOcrCompletionSeconds": 15,
      "message": "Prescription uploaded successfully. AI entity extraction pipeline initiated."
    },
    "meta": {
      "timestamp": "2026-11-23T15:22:00.080Z",
      "requestId": "req_01HJ8ZY656M3K9V1R7X4P2L9N0"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `FILE_MISSING`, `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`
  - `415 Unsupported Media Type`: `UNSUPPORTED_MIME_TYPE`

---

### 6.2 List Prescriptions
- **Method / Path:** `GET /api/v1/prescriptions`
- **Description:** Lists all active and historical prescriptions for the patient, ordered by date descending with OCR status.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Query Parameters:**
  ```typescript
  interface ListPrescriptionsQuery {
    patientId?: string;
    ocrStatus?: 'PROCESSING' | 'COMPLETED' | 'NEEDS_DOCTOR_REVIEW' | 'FAILED';
    fromDate?: string;
    toDate?: string;
    cursor?: string;
    limit?: number;
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "prescriptions": [
        {
          "id": "prx_01HJ8ZY654M1N8P9R4L2W7Q3X1",
          "doctorName": "Dr. Rajesh Iyer",
          "hospitalName": "Apollo Hospitals, Bannerghatta Road",
          "prescriptionDate": "2026-11-20",
          "ocrStatus": "COMPLETED",
          "itemsCount": 4,
          "source": "PAPER_UPLOAD",
          "isVerifiedByDoctor": true,
          "thumbnailUrl": "https://storage.elderguardian.ai/prescriptions/thumbnails/prx_01HJ8ZY654.jpg",
          "createdAt": "2026-11-20T11:45:00.000Z"
        },
        {
          "id": "prx_01HJ8ZZ123M4N2P1R9L5W8Q0X2",
          "doctorName": "Dr. Ananya Mukherjee",
          "hospitalName": "Apollo Hospitals",
          "prescriptionDate": "2026-08-15",
          "ocrStatus": "COMPLETED",
          "itemsCount": 3,
          "source": "DIGITAL_E_PRESCRIPTION",
          "isVerifiedByDoctor": true,
          "thumbnailUrl": "https://storage.elderguardian.ai/prescriptions/thumbnails/prx_01HJ8ZZ123.jpg",
          "createdAt": "2026-08-15T12:00:00.000Z"
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:23:00.000Z",
      "requestId": "req_01HJ8ZZ125M1K8V3R9X2P4L7N5",
      "pagination": {
        "nextCursor": null,
        "prevCursor": null,
        "hasMore": false,
        "limit": 20,
        "totalCount": 2
      }
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`

---

### 6.3 Get Prescription by ID
- **Method / Path:** `GET /api/v1/prescriptions/:id`
- **Description:** Returns the complete prescription record including uploaded document link, diagnosis tags, doctor signature, and AI extraction summary.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Path Parameters:**
  - `id`: Prescription UUID
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "prx_01HJ8ZY654M1N8P9R4L2W7Q3X1",
      "patientId": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
      "doctorName": "Dr. Rajesh Iyer",
      "doctorRegistrationNumber": "KMC-48291",
      "hospitalName": "Apollo Hospitals, Bannerghatta Road",
      "prescriptionDate": "2026-11-20",
      "diagnosis": ["Hypertension Stage II", "Type 2 Diabetes Mellitus - Controlled"],
      "documentUrl": "https://storage.elderguardian.ai/prescriptions/2026/11/prx_01HJ8ZY654.pdf",
      "ocrStatus": "COMPLETED",
      "aiConfidenceScore": 0.98,
      "isVerifiedByDoctor": true,
      "verifiedAt": "2026-11-20T12:30:00.000Z",
      "specialInstructions": "Monitor morning fasting blood sugar regularly. Restrict salt intake under 4g daily.",
      "nextFollowUpDate": "2027-02-20"
    },
    "meta": {
      "timestamp": "2026-11-23T15:24:10.020Z",
      "requestId": "req_01HJ901234M9K2V7R1X8P3L5N9"
    }
  }
  ```
- **Error Codes:**
  - `404 Not Found`: `PRESCRIPTION_NOT_FOUND`

---

### 6.4 Get Normalized Prescription Items (Medicines)
- **Method / Path:** `GET /api/v1/prescriptions/:id/items`
- **Description:** Returns all structured medication items parsed from the prescription with dosage, frequency, food relation, and duration.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Path Parameters:**
  - `id`: Prescription UUID
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "prescriptionId": "prx_01HJ8ZY654M1N8P9R4L2W7Q3X1",
      "items": [
        {
          "id": "pxi_01HJ902198M4N1P8R2L9W5Q7X1",
          "medicineName": "Telma 40",
          "genericName": "Telmisartan",
          "strength": "40 mg",
          "dosageForm": "TABLET",
          "frequency": "ONCE_DAILY",
          "timing": "MORNING",
          "foodRelation": "AFTER_FOOD",
          "durationDays": 90,
          "prescribedQuantity": 90,
          "dispensedQuantity": 90,
          "instructions": "Take at 8:00 AM every morning with water",
          "linkedMedicationScheduleId": "med_01HJ904321M9N2P7R1L8W4Q6X0"
        },
        {
          "id": "pxi_01HJ902198M4N1P8R2L9W5Q7X2",
          "medicineName": "Glycomet-GP 1",
          "genericName": "Glimepiride 1mg + Metformin 500mg",
          "strength": "500 mg / 1 mg",
          "dosageForm": "TABLET",
          "frequency": "TWICE_DAILY",
          "timing": "MORNING_AND_NIGHT",
          "foodRelation": "BEFORE_FOOD",
          "durationDays": 90,
          "prescribedQuantity": 180,
          "dispensedQuantity": 180,
          "instructions": "Take 15 minutes before breakfast and dinner",
          "linkedMedicationScheduleId": "med_01HJ904321M9N2P7R1L8W4Q6X1"
        },
        {
          "id": "pxi_01HJ902198M4N1P8R2L9W5Q7X3",
          "medicineName": "Atorva 10",
          "genericName": "Atorvastatin Calcium",
          "strength": "10 mg",
          "dosageForm": "TABLET",
          "frequency": "ONCE_DAILY",
          "timing": "BEDTIME",
          "foodRelation": "AFTER_FOOD",
          "durationDays": 90,
          "prescribedQuantity": 90,
          "dispensedQuantity": 90,
          "instructions": "Take at 9:30 PM before sleeping",
          "linkedMedicationScheduleId": "med_01HJ904321M9N2P7R1L8W4Q6X2"
        },
        {
          "id": "pxi_01HJ902198M4N1P8R2L9W5Q7X4",
          "medicineName": "Pantocid 40",
          "genericName": "Pantoprazole Sodium",
          "strength": "40 mg",
          "dosageForm": "TABLET",
          "frequency": "ONCE_DAILY",
          "timing": "MORNING",
          "foodRelation": "EMPTY_STOMACH",
          "durationDays": 30,
          "prescribedQuantity": 30,
          "dispensedQuantity": 30,
          "instructions": "Take empty stomach with warm water upon waking",
          "linkedMedicationScheduleId": "med_01HJ904321M9N2P7R1L8W4Q6X3"
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:25:00.030Z",
      "requestId": "req_01HJ902199M1K8V4R2X9P7L1N4"
    }
  }
  ```
- **Error Codes:**
  - `404 Not Found`: `PRESCRIPTION_NOT_FOUND`


---

## 7. MEDICATION ENDPOINTS

### 7.1 List Active Medication Schedules
- **Method / Path:** `GET /api/v1/medications`
- **Description:** Retrieves all ongoing active medication routines for the elder, including dosage form, food relation, remaining pill count, and prescribed duration.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Query Parameters:**
  ```typescript
  interface ListMedicationsQuery {
    patientId?: string;                         // Required if caller is FAMILY_MEMBER
    status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED'; // Default 'ACTIVE'
    cursor?: string;
    limit?: number;
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "medications": [
        {
          "id": "med_01HJ904321M9N2P7R1L8W4Q6X0",
          "brandName": "Telma 40",
          "genericName": "Telmisartan",
          "strength": "40 mg",
          "form": "TABLET",
          "pillColor": "Reddish Brown",
          "pillShape": "Round",
          "conditionTreated": "Hypertension",
          "schedule": {
            "frequency": "ONCE_DAILY",
            "timeSlots": ["08:00"],
            "foodRelation": "AFTER_BREAKFAST"
          },
          "inventory": {
            "currentPillsRemaining": 8,
            "refillThreshold": 10,
            "daysRemaining": 8,
            "status": "REFILL_DUE"
          },
          "startDate": "2026-11-20",
          "endDate": "2027-02-20",
          "prescribedByDoctor": "Dr. Rajesh Iyer",
          "isActive": true
        },
        {
          "id": "med_01HJ904321M9N2P7R1L8W4Q6X1",
          "brandName": "Glycomet-GP 1",
          "genericName": "Glimepiride 1mg + Metformin 500mg",
          "strength": "500 mg / 1 mg",
          "form": "TABLET",
          "pillColor": "White",
          "pillShape": "Oblong",
          "conditionTreated": "Type 2 Diabetes Mellitus",
          "schedule": {
            "frequency": "TWICE_DAILY",
            "timeSlots": ["08:15", "20:00"],
            "foodRelation": "BEFORE_FOOD"
          },
          "inventory": {
            "currentPillsRemaining": 32,
            "refillThreshold": 14,
            "daysRemaining": 16,
            "status": "SUFFICIENT"
          },
          "startDate": "2026-11-20",
          "endDate": "2027-02-20",
          "prescribedByDoctor": "Dr. Rajesh Iyer",
          "isActive": true
        },
        {
          "id": "med_01HJ904321M9N2P7R1L8W4Q6X2",
          "brandName": "Atorva 10",
          "genericName": "Atorvastatin",
          "strength": "10 mg",
          "form": "TABLET",
          "pillColor": "Yellow",
          "pillShape": "Oval",
          "conditionTreated": "Hypercholesterolemia",
          "schedule": {
            "frequency": "ONCE_DAILY",
            "timeSlots": ["21:30"],
            "foodRelation": "AFTER_DINNER"
          },
          "inventory": {
            "currentPillsRemaining": 25,
            "refillThreshold": 7,
            "daysRemaining": 25,
            "status": "SUFFICIENT"
          },
          "startDate": "2026-11-20",
          "endDate": "2027-02-20",
          "prescribedByDoctor": "Dr. Rajesh Iyer",
          "isActive": true
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:30:00.000Z",
      "requestId": "req_01HJ904323M1K8V2R4X9P7L3N1",
      "pagination": {
        "nextCursor": null,
        "prevCursor": null,
        "hasMore": false,
        "limit": 20,
        "totalCount": 3
      }
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`
  - `403 Forbidden`: `FORBIDDEN_PATIENT_ACCESS`

---

### 7.2 Record Medication Dose Event
- **Method / Path:** `POST /api/v1/medications/:id/doses`
- **Description:** Records an elder's medication ingestion event (taken, missed, or skipped), updates remaining pill inventory automatically, and dispatches real-time caregiver alerts if a critical dose was missed.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`
- **Path Parameters:**
  - `id`: Medication Schedule UUID (`med_01HJ904321M9N2P7R1L8W4Q6X0`)
- **Request Body:**
  ```typescript
  interface RecordDoseRequest {
    scheduledTime: string;                      // "2026-11-23T08:00:00.000Z"
    status: 'TAKEN' | 'MISSED' | 'SKIPPED';
    recordedAt?: string;                        // "2026-11-23T08:12:00.000Z"
    skipReason?: 'NAUSEA' | 'UPSET_STOMACH' | 'FORGOT_WHILE_TRAVELING' | 'FASTING' | 'DOCTOR_ADVISED' | 'OTHER';
    notes?: string;                             // "Taken with a glass of warm water and light breakfast"
    deviceSource?: 'MOBILE_APP' | 'SMART_PILL_DISPENSER' | 'WHATSAPP_BOT' | 'VOICE_ASSISTANT';
  }
  ```
- **Response Body (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "doseEventId": "dos_01HJ905412M3N8P1R7L4W2Q9X5",
      "medicationId": "med_01HJ904321M9N2P7R1L8W4Q6X0",
      "brandName": "Telma 40",
      "status": "TAKEN",
      "scheduledTime": "2026-11-23T08:00:00.000Z",
      "recordedAt": "2026-11-23T08:12:00.000Z",
      "timeDifferenceMinutes": 12,
      "updatedPillsRemaining": 7,
      "adherenceStreakDays": 14,
      "inventoryWarning": {
        "status": "REFILL_URGENT",
        "message": "Only 7 tablets remaining of Telma 40. Auto-refill recommendation created."
      }
    },
    "meta": {
      "timestamp": "2026-11-23T15:31:00.040Z",
      "requestId": "req_01HJ905415M2K9V4R8X1P5L7N3"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `VALIDATION_FAILED`, `DUPLICATE_DOSE_RECORDING`
  - `404 Not Found`: `MEDICATION_NOT_FOUND`

---

### 7.3 Get Today's Medication Schedule (Elder-Optimized)
- **Method / Path:** `GET /api/v1/medications/today`
- **Description:** Returns today's medication routine grouped into elder-intuitive diurnal time windows (Morning, Afternoon, Evening, Night) with high-contrast color badges, meal instructions, and current intake status.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`
- **Query Parameters:**
  - `patientId?: string` (Required if family member)
  - `timezone?: string` (e.g. `Asia/Kolkata`, default)
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "date": "2026-11-23",
      "timezone": "Asia/Kolkata",
      "totalDosesToday": 4,
      "completedDoses": 2,
      "pendingDoses": 2,
      "overallStatus": "ON_TRACK",
      "slots": [
        {
          "slotName": "MORNING",
          "displayTime": "08:00 AM - 09:00 AM",
          "medicines": [
            {
              "medicationId": "med_01HJ904321M9N2P7R1L8W4Q6X0",
              "brandName": "Telma 40",
              "strength": "40 mg",
              "dosage": "1 Tablet",
              "foodRelation": "After Breakfast",
              "scheduledTime": "2026-11-23T08:00:00+05:30",
              "status": "TAKEN",
              "takenAt": "2026-11-23T08:12:00+05:30",
              "pillColor": "Reddish Brown",
              "pillIcon": "pill-round"
            },
            {
              "medicationId": "med_01HJ904321M9N2P7R1L8W4Q6X1",
              "brandName": "Glycomet-GP 1",
              "strength": "500 mg / 1 mg",
              "dosage": "1 Tablet",
              "foodRelation": "15 min Before Breakfast",
              "scheduledTime": "2026-11-23T08:15:00+05:30",
              "status": "TAKEN",
              "takenAt": "2026-11-23T08:10:00+05:30",
              "pillColor": "White",
              "pillIcon": "pill-capsule"
            }
          ]
        },
        {
          "slotName": "AFTERNOON",
          "displayTime": "01:00 PM - 02:00 PM",
          "medicines": []
        },
        {
          "slotName": "EVENING",
          "displayTime": "05:00 PM - 06:00 PM",
          "medicines": []
        },
        {
          "slotName": "NIGHT_BEDTIME",
          "displayTime": "08:00 PM - 09:30 PM",
          "medicines": [
            {
              "medicationId": "med_01HJ904321M9N2P7R1L8W4Q6X1",
              "brandName": "Glycomet-GP 1",
              "strength": "500 mg / 1 mg",
              "dosage": "1 Tablet",
              "foodRelation": "Before Dinner",
              "scheduledTime": "2026-11-23T20:00:00+05:30",
              "status": "PENDING",
              "takenAt": null,
              "pillColor": "White",
              "pillIcon": "pill-capsule"
            },
            {
              "medicationId": "med_01HJ904321M9N2P7R1L8W4Q6X2",
              "brandName": "Atorva 10",
              "strength": "10 mg",
              "dosage": "1 Tablet",
              "foodRelation": "After Dinner at Bedtime",
              "scheduledTime": "2026-11-23T21:30:00+05:30",
              "status": "PENDING",
              "takenAt": null,
              "pillColor": "Yellow",
              "pillIcon": "pill-oval"
            }
          ]
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:32:00.015Z",
      "requestId": "req_01HJ906124M8K2V9R3X7P1L5N0"
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`

---

### 7.4 Get Medication Adherence Statistics
- **Method / Path:** `GET /api/v1/medications/adherence`
- **Description:** Aggregates adherence percentage, consecutive streaks, missed dose patterns, and generates AI behavioural tips for caregivers.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Query Parameters:**
  ```typescript
  interface AdherenceStatsQuery {
    patientId?: string;
    periodDays?: number;                        // 7, 30, or 90 (default 30)
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "periodDays": 30,
      "dateRange": {
        "start": "2026-10-24",
        "end": "2026-11-23"
      },
      "summary": {
        "adherenceRatePercentage": 94.2,
        "totalScheduledDoses": 120,
        "dosesTakenOnTime": 105,
        "dosesTakenLate": 8,
        "dosesMissed": 5,
        "dosesSkipped": 2,
        "currentStreakDays": 14,
        "longestStreakDays": 22
      },
      "adherenceBySlot": {
        "morning": 98.3,
        "afternoon": 100.0,
        "night": 89.5
      },
      "aiInsights": [
        "Patient exhibits highest adherence during Morning (98.3%).",
        "Missed doses frequently occur on Saturday nights (4 out of 5 missed doses). Recommend automated WhatsApp reminder to caregiver Rahul Sharma at 8:30 PM on weekends."
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:33:10.020Z",
      "requestId": "req_01HJ907128M1K4V8R2X9P3L6N2"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `INVALID_PERIOD_DAYS`

---

## 8. REFILL ENDPOINTS

### 8.1 Get Upcoming Predicted Refills
- **Method / Path:** `GET /api/v1/refills/upcoming`
- **Description:** AI inventory algorithm calculates precise run-out projections based on actual daily ingestion rates, flagging medicines reaching critical safety thresholds (< 7 days supply).
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`
- **Query Parameters:**
  - `patientId?: string` (Required if family member)
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "predictedRefills": [
        {
          "medicationId": "med_01HJ904321M9N2P7R1L8W4Q6X0",
          "brandName": "Telma 40 (Telmisartan 40mg)",
          "currentPillsRemaining": 7,
          "dailyConsumptionRate": 1.0,
          "estimatedRunoutDate": "2026-11-30",
          "daysRemaining": 7,
          "urgency": "HIGH",
          "recommendedOrderPackSize": 30,
          "estimatedCostINR": 245.00,
          "activePrescription": {
            "prescriptionId": "prx_01HJ8ZY654M1N8P9R4L2W7Q3X1",
            "doctorName": "Dr. Rajesh Iyer",
            "prescribedDate": "2026-11-20"
          }
        },
        {
          "medicationId": "med_01HJ904321M9N2P7R1L8W4Q6X1",
          "brandName": "Glycomet-GP 1",
          "currentPillsRemaining": 32,
          "dailyConsumptionRate": 2.0,
          "estimatedRunoutDate": "2026-12-09",
          "daysRemaining": 16,
          "urgency": "LOW",
          "recommendedOrderPackSize": 60,
          "estimatedCostINR": 310.00,
          "activePrescription": {
            "prescriptionId": "prx_01HJ8ZY654M1N8P9R4L2W7Q3X1",
            "doctorName": "Dr. Rajesh Iyer",
            "prescribedDate": "2026-11-20"
          }
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:35:00.010Z",
      "requestId": "req_01HJ908123M9K1V7R4X8P2L5N0"
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`

---

### 8.2 Request Medication Refill
- **Method / Path:** `POST /api/v1/refills/request`
- **Description:** Places a doorstep medicine refill request with an integrated pharmacy delivery partner (Apollo Pharmacy, Tata 1mg, MedPlus).
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`
- **Request Body:**
  ```typescript
  interface RefillOrderRequest {
    patientId: string;                          // "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3"
    prescriptionId: string;                     // "prx_01HJ8ZY654M1N8P9R4L2W7Q3X1"
    pharmacyPartner: 'APOLLO_PHARMACY' | 'TATA_1MG' | 'MEDPLUS';
    deliveryAddress: {
      line1: string;                            // "Flat 402, Shanti Nilayam Apartments"
      line2: string;                            // "14th Main, 4th Block, Jayanagar"
      city: string;                             // "Bengaluru"
      state: string;                            // "Karnataka"
      pincode: string;                          // "560011"
      contactPhone: string;                     // "+919876543210"
    };
    items: Array<{
      medicationId: string;                     // "med_01HJ904321M9N2P7R1L8W4Q6X0"
      brandName: string;                        // "Telma 40"
      quantityPills: number;                    // 30
    }>;
    urgency: 'STANDARD' | 'EXPRESS_SAME_DAY';
    notes?: string;                             // "Please ring bell twice and hand over to Mr. Rameshwar Sharma"
  }
  ```
- **Response Body (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "refillOrder": {
        "id": "ref_01HJ909187M3N4P8R1L5W9Q2X7",
        "orderNumber": "EG-REF-2026-8812",
        "patientId": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
        "pharmacyPartner": "APOLLO_PHARMACY",
        "status": "PENDING_APPROVAL",
        "items": [
          {
            "medicationId": "med_01HJ904321M9N2P7R1L8W4Q6X0",
            "brandName": "Telma 40",
            "quantityPills": 30,
            "unitPriceINR": 8.16,
            "totalPriceINR": 245.00
          }
        ],
        "subtotalINR": 245.00,
        "deliveryFeeINR": 0.00,
        "totalAmountINR": 245.00,
        "estimatedDelivery": "2026-11-24T18:00:00.000Z",
        "requiresCaregiverApproval": true,
        "pendingApprover": "Rahul Sharma (Primary Caregiver)",
        "createdAt": "2026-11-23T15:36:00.000Z"
      }
    },
    "meta": {
      "timestamp": "2026-11-23T15:36:00.080Z",
      "requestId": "req_01HJ909190M2K8V3R1X4P6L9N5"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `INVALID_REFILL_ITEMS`, `EXPIRED_PRESCRIPTION`
  - `404 Not Found`: `PRESCRIPTION_OR_MEDICATION_NOT_FOUND`

---

### 8.3 Approve Refill Order
- **Method / Path:** `POST /api/v1/refills/:id/approve`
- **Description:** Caregiver or Doctor authorizes the pending refill order and dispatches it to the pharmacy fulfillment network.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `FAMILY_MEMBER` (with `orderRefills` permission), `DOCTOR`, `PATIENT`
- **Path Parameters:**
  - `id`: Refill Order UUID
- **Request Body:**
  ```typescript
  interface ApproveRefillRequest {
    paymentMethod: 'UPI' | 'SAVED_CARD' | 'CASH_ON_DELIVERY';
    paymentReferenceId?: string;                // Razorpay Payment ID if prepaid
    approvalRemarks?: string;                   // "Approved 1-month supply for Father"
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "refillOrderId": "ref_01HJ909187M3N4P8R1L5W9Q2X7",
      "status": "APPROVED_DISPATCHING",
      "approvedBy": {
        "name": "Rahul Sharma",
        "role": "FAMILY_MEMBER (SON)",
        "approvedAt": "2026-11-23T15:38:00.000Z"
      },
      "pharmacyPartner": "APOLLO_PHARMACY",
      "partnerOrderId": "APL-BLR-992014",
      "trackingStatusUrl": "https://track.apollopharmacy.in/order/APL-BLR-992014",
      "estimatedDelivery": "2026-11-24T18:00:00.000Z"
    },
    "meta": {
      "timestamp": "2026-11-23T15:38:00.050Z",
      "requestId": "req_01HJ90A112M8K1V9R4X2P7L5N3"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `ORDER_NOT_IN_PENDING_STATE`
  - `403 Forbidden`: `CAREGIVER_NOT_AUTHORIZED_TO_APPROVE`
  - `404 Not Found`: `REFILL_ORDER_NOT_FOUND`

---

### 8.4 Reject Refill Order
- **Method / Path:** `POST /api/v1/refills/:id/reject`
- **Description:** Rejects a pending refill order (e.g. if the doctor recently altered the patient's regimen or caregiver purchased medicines locally).
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `FAMILY_MEMBER`, `DOCTOR`, `PATIENT`
- **Path Parameters:**
  - `id`: Refill Order UUID
- **Request Body:**
  ```typescript
  interface RejectRefillRequest {
    rejectionReason: string;                    // "Purchased directly from local medical store in Jayanagar"
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "refillOrderId": "ref_01HJ909187M3N4P8R1L5W9Q2X7",
      "status": "REJECTED",
      "rejectedAt": "2026-11-23T15:39:00.000Z",
      "rejectionReason": "Purchased directly from local medical store in Jayanagar"
    },
    "meta": {
      "timestamp": "2026-11-23T15:39:00.020Z",
      "requestId": "req_01HJ90B234M1K9V4R8X3P1L6N9"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `ORDER_ALREADY_DISPATCHED_CANNOT_REJECT`
  - `404 Not Found`: `REFILL_ORDER_NOT_FOUND`

---

### 8.5 List Refill Order History
- **Method / Path:** `GET /api/v1/refills`
- **Description:** Retrieves past pharmacy refill orders, delivery proofs, itemized tax invoices, and tracking links.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`
- **Query Parameters:**
  ```typescript
  interface ListRefillsQuery {
    patientId?: string;
    status?: 'PENDING_APPROVAL' | 'APPROVED_DISPATCHING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'REJECTED';
    cursor?: string;
    limit?: number;
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "refillOrders": [
        {
          "id": "ref_01HJ909187M3N4P8R1L5W9Q2X7",
          "orderNumber": "EG-REF-2026-8812",
          "pharmacyPartner": "APOLLO_PHARMACY",
          "itemsSummary": "Telma 40 (30 tablets)",
          "totalAmountINR": 245.00,
          "status": "APPROVED_DISPATCHING",
          "createdAt": "2026-11-23T15:36:00.000Z"
        },
        {
          "id": "ref_01HJ8W8912M4N1P2R7L3W8Q5X4",
          "orderNumber": "EG-REF-2026-7241",
          "pharmacyPartner": "TATA_1MG",
          "itemsSummary": "Glycomet-GP 1 (60 tablets), Atorva 10 (30 tablets)",
          "totalAmountINR": 610.00,
          "status": "DELIVERED",
          "deliveredAt": "2026-10-25T14:20:00.000Z",
          "createdAt": "2026-10-24T09:10:00.000Z"
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:40:00.000Z",
      "requestId": "req_01HJ90C456M3K2V8R1X9P4L7N2",
      "pagination": {
        "nextCursor": null,
        "prevCursor": null,
        "hasMore": false,
        "limit": 20,
        "totalCount": 2
      }
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`


---

## 9. HEALTH READINGS ENDPOINTS

### 9.1 Ingest Health Vital Reading
- **Method / Path:** `POST /api/v1/health/readings`
- **Description:** Records a physiological vital reading (Blood Pressure, Blood Glucose, SpO2, Heart Rate, Temperature, Weight). Real-time rule engine evaluates clinical safety thresholds and automatically triggers caregiver SMS/WhatsApp alerts if hypertensive crisis or hypoglycemia is detected.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Request Body:**
  ```typescript
  interface RecordHealthReadingRequest {
    patientId: string;                          // "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3"
    readingType: 'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE' | 'HEART_RATE' | 'SPO2' | 'BODY_TEMPERATURE' | 'WEIGHT';
    // For BLOOD_PRESSURE:
    bloodPressure?: {
      systolic: number;                         // e.g. 138 (mmHg)
      diastolic: number;                        // e.g. 86 (mmHg)
      pulseBpm?: number;                        // e.g. 74
    };
    // For single numeric metrics:
    numericValue?: number;                      // e.g. 142 (for glucose mg/dL, SpO2 %, or weight kg)
    unit: 'mmHg' | 'mg/dL' | 'bpm' | '%' | 'celsius' | 'kg';
    readingContext?: 'FASTING' | 'POST_PRANDIAL_2HR' | 'RANDOM' | 'RESTING' | 'BEFORE_BED' | 'POST_EXERCISE';
    deviceSource: 'MANUAL_ENTRY' | 'OMRON_HEM_7156T' | 'ACCU_CHEK_ACTIVE' | 'APPLE_HEALTH' | 'BEURER_PULSE_OXIMETER';
    recordedAt: string;                         // "2026-11-23T07:45:00.000Z"
    notes?: string;                             // "Taken 10 minutes after morning walk"
  }
  ```
- **Response Body (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "readingId": "vit_01HJ90D789M2N1P4R8L5W3Q9X6",
      "patientId": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
      "readingType": "BLOOD_PRESSURE",
      "values": {
        "systolic": 138,
        "diastolic": 86,
        "unit": "mmHg",
        "pulseBpm": 74
      },
      "readingContext": "RESTING",
      "clinicalEvaluation": {
        "category": "STAGE_1_HYPERTENSION",
        "severity": "MODERATE_WARNING",
        "isCritical": false,
        "interpretation": "Systolic reading (138 mmHg) is slightly above target range (<130 mmHg) for elderly hypertensive patients."
      },
      "caregiverAlertTriggered": false,
      "recordedAt": "2026-11-23T07:45:00.000Z"
    },
    "meta": {
      "timestamp": "2026-11-23T15:42:00.045Z",
      "requestId": "req_01HJ90D792M1K8V3R7X2P9L4N1"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `INVALID_READING_PAYLOAD`, `PHYSIOLOGICALLY_IMPOSSIBLE_VALUE`
  - `404 Not Found`: `PATIENT_NOT_FOUND`

---

### 9.2 List Historical Health Readings
- **Method / Path:** `GET /api/v1/health/readings`
- **Description:** Retrieves paginated vital readings filtered by physiological metric type and date range, with clinical alert tags.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Query Parameters:**
  ```typescript
  interface ListHealthReadingsQuery {
    patientId?: string;
    readingType?: 'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE' | 'HEART_RATE' | 'SPO2' | 'BODY_TEMPERATURE' | 'WEIGHT';
    startDate?: string;                         // "2026-11-01"
    endDate?: string;                           // "2026-11-23"
    cursor?: string;
    limit?: number;
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "readings": [
        {
          "id": "vit_01HJ90D789M2N1P4R8L5W3Q9X6",
          "readingType": "BLOOD_PRESSURE",
          "values": { "systolic": 138, "diastolic": 86, "unit": "mmHg", "pulseBpm": 74 },
          "context": "RESTING",
          "status": "STAGE_1_HYPERTENSION",
          "recordedAt": "2026-11-23T07:45:00.000Z"
        },
        {
          "id": "vit_01HJ8Y8812M9N3P1R4L7W2Q0X4",
          "readingType": "BLOOD_PRESSURE",
          "values": { "systolic": 126, "diastolic": 80, "unit": "mmHg", "pulseBpm": 71 },
          "context": "RESTING",
          "status": "NORMAL",
          "recordedAt": "2026-11-22T08:00:00.000Z"
        },
        {
          "id": "vit_01HJ8X1290M4N8P2R9L1W5Q7X8",
          "readingType": "BLOOD_PRESSURE",
          "values": { "systolic": 130, "diastolic": 82, "unit": "mmHg", "pulseBpm": 73 },
          "context": "RESTING",
          "status": "NORMAL",
          "recordedAt": "2026-11-21T07:50:00.000Z"
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:43:00.010Z",
      "requestId": "req_01HJ90E112M8K4V9R1X3P7L6N8",
      "pagination": {
        "nextCursor": "ZXlKaWRIa2lPaUp...",
        "prevCursor": null,
        "hasMore": false,
        "limit": 20,
        "totalCount": 3
      }
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`

---

### 9.3 Get Vital Health Trends & AI Anomaly Detection
- **Method / Path:** `GET /api/v1/health/trends`
- **Description:** Computes rolling averages, standard deviation, time-in-range percentage, and flags AI clinical anomalies (e.g. rising blood pressure trend preceding doctor visits).
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Query Parameters:**
  ```typescript
  interface HealthTrendsQuery {
    patientId?: string;
    readingType: 'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE' | 'HEART_RATE' | 'SPO2';
    period: '7D' | '30D' | '90D';
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "readingType": "BLOOD_PRESSURE",
      "period": "30D",
      "dateRange": { "start": "2026-10-24", "end": "2026-11-23" },
      "totalObservations": 42,
      "metrics": {
        "meanSystolic": 131.4,
        "meanDiastolic": 82.1,
        "minSystolic": 120,
        "maxSystolic": 152,
        "targetSystolicRange": { "min": 110, "max": 135 },
        "timeInRangePercentage": 85.7
      },
      "weeklyAverages": [
        { "week": "2026-W44", "avgSystolic": 128.2, "avgDiastolic": 80.5, "status": "CONTROLLED" },
        { "week": "2026-W45", "avgSystolic": 129.5, "avgDiastolic": 81.0, "status": "CONTROLLED" },
        { "week": "2026-W46", "avgSystolic": 132.0, "avgDiastolic": 82.8, "status": "MILD_ELEVATION" },
        { "week": "2026-W47", "avgSystolic": 136.1, "avgDiastolic": 84.2, "status": "MILD_ELEVATION" }
      ],
      "aiClinicalInsights": [
        "Systolic BP has exhibited an upward drift of +7.9 mmHg over the last 14 days.",
        "Correlation detected: Days with missed Telma 40 doses (Nov 12, Nov 18) showed systolic spikes > 145 mmHg.",
        "Recommendation: Clinical consultation with Dr. Rajesh Iyer on Nov 25 is appropriately scheduled to evaluate dose adequacy."
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:44:10.020Z",
      "requestId": "req_01HJ90F345M1K9V8R2X4P1L7N3"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `INVALID_TREND_METRIC`

---

## 10. NOTIFICATION ENDPOINTS

### 10.1 List Notifications and Care Alerts
- **Method / Path:** `GET /api/v1/notifications`
- **Description:** Returns categorized notification feed for the elder or family caregiver, including medication chime alarms, SOS emergency alerts, vital warnings, and appointment reminders.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Query Parameters:**
  ```typescript
  interface ListNotificationsQuery {
    unreadOnly?: boolean;                       // true / false (default false)
    category?: 'MEDICATION_REMINDER' | 'CRITICAL_VITAL_ALERT' | 'APPOINTMENT_REMINDER' | 'REFILL_DUE' | 'CARE_NOTE';
    cursor?: string;
    limit?: number;
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "unreadCount": 2,
      "notifications": [
        {
          "id": "not_01HJ90G812M4N9P1R7L3W8Q2X9",
          "category": "MEDICATION_REMINDER",
          "priority": "HIGH",
          "title": "Evening Medicine Due: Glycomet-GP 1",
          "message": "Please take 1 tablet of Glycomet-GP 1 15 minutes before dinner.",
          "isRead": false,
          "actionType": "RECORD_DOSE",
          "actionPayload": {
            "medicationId": "med_01HJ904321M9N2P7R1L8W4Q6X1",
            "scheduledTime": "2026-11-23T20:00:00+05:30"
          },
          "createdAt": "2026-11-23T14:30:00.000Z"
        },
        {
          "id": "not_01HJ90G812M4N9P1R7L3W8Q2X8",
          "category": "REFILL_DUE",
          "priority": "HIGH",
          "title": "Low Inventory Alert: Telma 40",
          "message": "Only 7 tablets remaining for Telma 40. Doorstep refill suggested.",
          "isRead": false,
          "actionType": "ORDER_REFILL",
          "actionPayload": {
            "medicationId": "med_01HJ904321M9N2P7R1L8W4Q6X0"
          },
          "createdAt": "2026-11-23T08:15:00.000Z"
        },
        {
          "id": "not_01HJ8Z1190M2N4P8R1L5W9Q3X4",
          "category": "APPOINTMENT_REMINDER",
          "priority": "MEDIUM",
          "title": "Upcoming Cardiology Visit in 2 Days",
          "message": "Appointment with Dr. Rajesh Iyer at Apollo Hospitals on Wednesday, 25 Nov at 10:00 AM.",
          "isRead": true,
          "actionType": "VIEW_APPOINTMENT",
          "actionPayload": {
            "appointmentId": "apt_01HJ8ZT567M3N1P8R4L2W6Q9X0"
          },
          "createdAt": "2026-11-23T04:00:00.000Z"
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:46:00.010Z",
      "requestId": "req_01HJ90G815M3K8V4R9X1P2L5N6",
      "pagination": {
        "nextCursor": null,
        "prevCursor": null,
        "hasMore": false,
        "limit": 20,
        "totalCount": 3
      }
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`

---

### 10.2 Mark Single Notification as Read
- **Method / Path:** `PUT /api/v1/notifications/:id/read`
- **Description:** Marks an individual notification or clinical alert as acknowledged and read.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Path Parameters:**
  - `id`: Notification UUID (`not_01HJ90G812M4N9P1R7L3W8Q2X9`)
- **Request Body:** None
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "not_01HJ90G812M4N9P1R7L3W8Q2X9",
      "isRead": true,
      "readAt": "2026-11-23T15:47:00.000Z"
    },
    "meta": {
      "timestamp": "2026-11-23T15:47:00.040Z",
      "requestId": "req_01HJ90H123M9K2V7R4X8P3L1N9"
    }
  }
  ```
- **Error Codes:**
  - `404 Not Found`: `NOTIFICATION_NOT_FOUND`

---

### 10.3 Mark All Notifications as Read
- **Method / Path:** `PUT /api/v1/notifications/read-all`
- **Description:** Marks all active notifications as read up to the specified timestamp.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`
- **Request Body:**
  ```typescript
  interface MarkAllReadRequest {
    upToTimestamp?: string;                     // ISO 8601 string, default current time
    category?: string;                          // Optional filter to mark only specific category
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "markedReadCount": 2,
      "unreadRemaining": 0,
      "updatedAt": "2026-11-23T15:48:00.000Z"
    },
    "meta": {
      "timestamp": "2026-11-23T15:48:00.025Z",
      "requestId": "req_01HJ90H891M1K4V9R2X7P5L8N2"
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`


---

## 11. DOCTOR-SPECIFIC ENDPOINTS

### 11.1 List Doctor's Assigned / Consented Patients
- **Method / Path:** `GET /api/v1/doctor/patients`
- **Description:** Retrieves all elderly patients who have established an active clinical relationship or ABDM consent with the authenticated doctor. Includes clinical risk stratification tags.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `DOCTOR`
- **Query Parameters:**
  ```typescript
  interface DoctorPatientsQuery {
    riskLevel?: 'CRITICAL' | 'HIGH_RISK' | 'MODERATE' | 'STABLE';
    search?: string;                            // Patient name or ABHA ID
    cursor?: string;
    limit?: number;
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "patients": [
        {
          "patientId": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
          "name": "Rameshwar Prasad Sharma",
          "age": 72,
          "gender": "MALE",
          "bloodGroup": "B+",
          "abhaAddress": "rameshwar.sharma@abdm",
          "chronicConditions": ["Type 2 Diabetes", "Hypertension", "Knee Osteoarthritis"],
          "riskTier": "MODERATE",
          "recentVitalsSummary": {
            "lastBP": "138/86 mmHg",
            "lastFastingGlucose": "134 mg/dL",
            "recordedAt": "2026-11-23T07:45:00.000Z"
          },
          "medicationAdherence30Days": 94.2,
          "lastConsultationDate": "2026-08-20",
          "nextScheduledVisit": "2026-11-25T10:00:00.000Z",
          "primaryCaregiver": {
            "name": "Rahul Sharma (Son)",
            "phone": "+919876543211"
          }
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:50:00.010Z",
      "requestId": "req_01HJ90J123M8K4V2R7X1P9L5N4",
      "pagination": {
        "nextCursor": null,
        "prevCursor": null,
        "hasMore": false,
        "limit": 20,
        "totalCount": 1
      }
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`
  - `403 Forbidden`: `DOCTOR_PRIVILEGES_REQUIRED`

---

### 11.2 Get Comprehensive Patient Clinical Records
- **Method / Path:** `GET /api/v1/doctor/patients/:id/records`
- **Description:** Returns the 360-degree longitudinal electronic medical record (EMR) for the patient, including diagnostic lab reports (HbA1c, Lipid Profile, Renal Function Test), AI vital telemetry graphs, and active prescriptions.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `DOCTOR`
- **Path Parameters:**
  - `id`: Patient UUID (`pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3`)
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "patientProfile": {
        "id": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
        "name": "Rameshwar Prasad Sharma",
        "age": 72,
        "gender": "MALE",
        "allergies": [
          { "allergen": "Sulfa Antibiotics", "severity": "SEVERE", "reaction": "Angioedema & Rash" }
        ],
        "activeDiagnoses": [
          { "code": "E11.9", "description": "Type 2 Diabetes Mellitus without complications" },
          { "code": "I10", "description": "Essential (primary) Hypertension" }
        ]
      },
      "consentStatus": {
        "isConsentActive": true,
        "consentType": "ABDM_ELECTRONIC_HEALTH_RECORD",
        "validUntil": "2027-11-23T23:59:59.000Z"
      },
      "recentLabReports": [
        {
          "testName": "Comprehensive Metabolic Panel & HbA1c",
          "labName": "Apollo Diagnostics, Bengaluru",
          "date": "2026-10-15",
          "results": [
            { "parameter": "HbA1c", "value": 7.4, "unit": "%", "status": "FAIR_CONTROL", "referenceRange": "< 7.0%" },
            { "parameter": "Fasting Plasma Glucose", "value": 138, "unit": "mg/dL", "status": "HIGH", "referenceRange": "70 - 100" },
            { "parameter": "Serum Creatinine", "value": 1.1, "unit": "mg/dL", "status": "NORMAL", "referenceRange": "0.7 - 1.3" },
            { "parameter": "eGFR", "value": 78, "unit": "mL/min/1.73m2", "status": "STAGE_2_MILD_CKD", "referenceRange": "> 60" }
          ],
          "reportPdfUrl": "https://storage.elderguardian.ai/labs/reports/apollo_cmp_oct2026.pdf"
        }
      ],
      "activeMedications": [
        { "name": "Telma 40", "dose": "40 mg", "frequency": "Once Daily (Morning)" },
        { "name": "Glycomet-GP 1", "dose": "500mg / 1mg", "frequency": "Twice Daily (Before Meals)" },
        { "name": "Atorva 10", "dose": "10 mg", "frequency": "Once Daily (Night)" }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:51:20.030Z",
      "requestId": "req_01HJ90K871M2K9V4R1X8P3L7N0"
    }
  }
  ```
- **Error Codes:**
  - `403 Forbidden`: `CONSENT_REVOKED_OR_EXPIRED`, `NO_CLINICAL_RELATIONSHIP`
  - `404 Not Found`: `PATIENT_NOT_FOUND`

---

### 11.3 Issue Digital E-Prescription
- **Method / Path:** `POST /api/v1/doctor/prescriptions`
- **Description:** Allows a certified clinician to author an authenticated digital e-prescription with cryptographic signature, automated drug-drug interaction screening, and instant synchronization with elder and caregiver schedules.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `DOCTOR`
- **Request Body:**
  ```typescript
  interface CreatePrescriptionRequest {
    patientId: string;                          // "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3"
    appointmentId?: string;                     // "apt_01HJ8ZT567M3N1P8R4L2W6Q9X0"
    hospitalId: string;                         // "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2"
    diagnosis: string[];                        // ["Hypertension Stage II", "Type 2 Diabetes Mellitus"]
    clinicalFindings: string;                   // "Bilateral pedal edema absent. Heart sounds S1 S2 normal. BP 138/86 in clinic."
    medicines: Array<{
      brandName: string;                        // "Telma 40"
      genericName: string;                      // "Telmisartan"
      strength: string;                         // "40 mg"
      dosageForm: 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'OINTMENT';
      frequency: 'ONCE_DAILY' | 'TWICE_DAILY' | 'THRICE_DAILY' | 'SOS_AS_NEEDED';
      timing: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'BEDTIME' | 'MORNING_AND_NIGHT';
      foodRelation: 'BEFORE_FOOD' | 'AFTER_FOOD' | 'WITH_FOOD' | 'EMPTY_STOMACH';
      durationDays: number;                     // 90
      quantityToDispense: number;               // 90
      specialInstructions?: string;             // "Take after light breakfast"
    }>;
    dietaryAndLifestyleAdvice?: string[];       // ["Restrict dietary sodium to < 3g/day", "Brisk 25-minute morning walk"]
    followUpDate: string;                       // "2027-02-25"
    digitalSignaturePin: string;                // Secure 6-digit Doctor PIN for signing
  }
  ```
- **Response Body (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "prescription": {
        "id": "prx_01HJ90M432M9N1P8R4L5W7Q2X8",
        "prescriptionNumber": "EG-RX-2026-1123-0941",
        "patientId": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
        "patientName": "Rameshwar Prasad Sharma",
        "doctor": {
          "id": "doc_01HJ8ZGK7M4N2P9Q5R1L8W3X04",
          "name": "Dr. Rajesh Iyer",
          "registrationNumber": "KMC-48291",
          "hospital": "Apollo Hospitals, Bannerghatta Road, Bengaluru"
        },
        "digitalSignature": {
          "signed": true,
          "algorithm": "SHA256withRSA",
          "signatureHash": "d7a8fbb94e6b208945a0b7c125df9872c3d5a1e80934...",
          "signedAt": "2026-11-23T15:53:00.000Z"
        },
        "drugInteractionCheck": {
          "status": "PASSED_NO_CONTRAINDICATIONS",
          "sulfaAllergyVerified": true
        },
        "itemsCount": 3,
        "followUpDate": "2027-02-25",
        "pdfDownloadUrl": "https://storage.elderguardian.ai/prescriptions/digital/EG-RX-2026-1123-0941.pdf"
      }
    },
    "meta": {
      "timestamp": "2026-11-23T15:53:00.080Z",
      "requestId": "req_01HJ90M435M1K8V2R9X4P7L1N5"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `ALLERGY_CONTRAINDICATION_DETECTED` (e.g. attempting to prescribe Sulfa drug), `INVALID_SIGNATURE_PIN`
  - `404 Not Found`: `PATIENT_NOT_FOUND`

---

### 11.4 Get Doctor's Daily Appointment Queue
- **Method / Path:** `GET /api/v1/doctor/appointments`
- **Description:** Lists the doctor's real-time outpatient queue for today or a chosen date, tracking patient arrival and OPD consultation state.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `DOCTOR`, `HOSPITAL_ADMIN`
- **Query Parameters:**
  ```typescript
  interface DoctorQueueQuery {
    date?: string;                              // "2026-11-25" (default today)
    status?: 'SCHEDULED' | 'WAITING_IN_OPD' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
    consultationType?: 'IN_PERSON' | 'VIDEO';
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "date": "2026-11-25",
      "hospital": "Apollo Hospitals, Bannerghatta Road",
      "totalAppointmentsToday": 14,
      "completedCount": 4,
      "waitingInOpd": 2,
      "queue": [
        {
          "appointmentId": "apt_01HJ8ZT567M3N1P8R4L2W6Q9X0",
          "tokenNumber": "OPD-12",
          "patient": {
            "id": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
            "name": "Rameshwar Prasad Sharma",
            "age": 72,
            "gender": "MALE",
            "caregiverPresent": "Rahul Sharma (Son)"
          },
          "scheduledTime": "2026-11-25T10:00:00.000Z",
          "status": "WAITING_IN_OPD",
          "consultationType": "IN_PERSON",
          "wheelchairDispatched": true,
          "reasonForVisit": "3-month Hypertension & Diabetes checkup; recurring knee pain"
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:54:10.015Z",
      "requestId": "req_01HJ90N123M9K4V7R2X8P3L6N0"
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`

---

## 12. FAMILY DASHBOARD ENDPOINTS

### 12.1 List Elderly Patients Linked to Family Caregiver
- **Method / Path:** `GET /api/v1/family/patients`
- **Description:** Returns all elderly parents or relatives managed by the logged-in family caregiver, with real-time status indicators (Safe, Attention Needed, Emergency).
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `FAMILY_MEMBER`
- **Query Parameters:** None
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "caregiver": {
        "id": "usr_01HJ8ZJ112N4M8X3P7L1R5Q2W9",
        "name": "Rahul Sharma",
        "relationship": "PRIMARY_FAMILY_CAREGIVER"
      },
      "linkedElders": [
        {
          "patientId": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
          "fullName": "Rameshwar Prasad Sharma",
          "relationship": "FATHER",
          "age": 72,
          "city": "Bengaluru (Jayanagar)",
          "currentHealthStatus": "STABLE",
          "todayAdherencePercentage": 100.0,
          "latestVitalsTime": "2026-11-23T07:45:00.000Z",
          "activeAlertsCount": 0,
          "accessLevel": "FULL_ACCESS",
          "avatarUrl": "https://cdn.elderguardian.ai/avatars/rameshwar_sharma.jpg"
        },
        {
          "patientId": "pat_01HJ8ZA987M1B4C2D8E3F9G1H5",
          "fullName": "Sunita Sharma",
          "relationship": "MOTHER",
          "age": 68,
          "city": "Bengaluru (Jayanagar)",
          "currentHealthStatus": "ATTENTION_NEEDED",
          "todayAdherencePercentage": 50.0,
          "latestVitalsTime": "2026-11-23T08:30:00.000Z",
          "activeAlertsCount": 1,
          "accessLevel": "FULL_ACCESS",
          "avatarUrl": "https://cdn.elderguardian.ai/avatars/sunita_sharma.jpg"
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:55:00.010Z",
      "requestId": "req_01HJ90P234M1K8V3R7X4P2L9N5"
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`

---

### 12.2 Get Elder's Caregiver Dashboard Summary
- **Method / Path:** `GET /api/v1/family/patients/:id/summary`
- **Description:** Complete health and security snapshot of an elderly parent: live medication adherence, latest vitals with alert banners, upcoming hospital appointments, and low medicine inventory warnings.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `FAMILY_MEMBER`
- **Path Parameters:**
  - `id`: Patient UUID (`pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3`)
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "patient": {
        "id": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
        "name": "Rameshwar Prasad Sharma",
        "age": 72,
        "fallDetectionSosStatus": "ACTIVE_NORMAL"
      },
      "todayMedicationCard": {
        "totalDosesToday": 4,
        "dosesTaken": 2,
        "dosesPending": 2,
        "nextDoseDue": {
          "medicine": "Glycomet-GP 1",
          "scheduledTime": "2026-11-23T20:00:00+05:30",
          "instructions": "15 min before dinner"
        }
      },
      "latestVitalsCard": {
        "bloodPressure": { "value": "138/86 mmHg", "status": "ELEVATED", "recordedAt": "07:45 AM today" },
        "fastingBloodSugar": { "value": "134 mg/dL", "status": "ELEVATED", "recordedAt": "07:30 AM today" },
        "spO2": { "value": "98%", "status": "NORMAL", "recordedAt": "07:45 AM today" }
      },
      "refillAlert": {
        "hasPendingRefill": true,
        "medicine": "Telma 40",
        "daysRemaining": 7,
        "actionRequired": "CONFIRM_APOLLO_DISPATCH"
      },
      "nextAppointment": {
        "doctor": "Dr. Rajesh Iyer",
        "hospital": "Apollo Hospitals, Bannerghatta Road",
        "date": "Wednesday, 25 Nov 2026 at 10:00 AM",
        "wheelchairPreBooked": true
      }
    },
    "meta": {
      "timestamp": "2026-11-23T15:56:00.025Z",
      "requestId": "req_01HJ90Q112M9K2V7R1X8P4L3N6"
    }
  }
  ```
- **Error Codes:**
  - `403 Forbidden`: `CAREGIVER_NOT_AUTHORIZED_FOR_PATIENT`
  - `404 Not Found`: `PATIENT_NOT_FOUND`

---

### 12.3 Get Elder's Medication Inventory & Pill Box Status
- **Method / Path:** `GET /api/v1/family/patients/:id/medications`
- **Description:** Gives family members full visibility into their elderly parent's medicine cabinet, current pill counts, adherence rate, and upcoming refill order approvals.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `FAMILY_MEMBER`
- **Path Parameters:**
  - `id`: Patient UUID
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "patientId": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
      "overallAdherence30Days": 94.2,
      "medications": [
        {
          "medicationId": "med_01HJ904321M9N2P7R1L8W4Q6X0",
          "brandName": "Telma 40",
          "strength": "40 mg",
          "currentPillsRemaining": 7,
          "daysRemaining": 7,
          "status": "REFILL_URGENT",
          "canOrderDoorstep": true
        },
        {
          "medicationId": "med_01HJ904321M9N2P7R1L8W4Q6X1",
          "brandName": "Glycomet-GP 1",
          "strength": "500 mg / 1 mg",
          "currentPillsRemaining": 32,
          "daysRemaining": 16,
          "status": "SUFFICIENT",
          "canOrderDoorstep": true
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:57:00.015Z",
      "requestId": "req_01HJ90Q891M3K4V9R2X7P5L8N2"
    }
  }
  ```
- **Error Codes:**
  - `403 Forbidden`: `UNAUTHORIZED_CAREGIVER_ACCESS`

---

### 12.4 Get Elder's Appointment Schedule & Care Coordination
- **Method / Path:** `GET /api/v1/family/patients/:id/appointments`
- **Description:** Allows caregivers to monitor all doctor visits, track hospital directions, book medical transport (cabs/ambulances), and coordinate accompaniment.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `FAMILY_MEMBER`
- **Path Parameters:**
  - `id`: Patient UUID
- **Query Parameters:**
  - `status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'`
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "patientId": "pat_01HJ8ZA1X4M2B9C8D7E6F5G4H3",
      "appointments": [
        {
          "id": "apt_01HJ8ZT567M3N1P8R4L2W6Q9X0",
          "doctorName": "Dr. Rajesh Iyer",
          "specialization": "Cardiology",
          "hospital": {
            "name": "Apollo Hospitals, Bannerghatta Road",
            "address": "154/11, Opp. IIMB, Bannerghatta Road, Bengaluru",
            "locationCoordinates": { "latitude": 12.8954, "longitude": 77.5986 }
          },
          "scheduledStartTime": "2026-11-25T10:00:00.000Z",
          "consultationType": "IN_PERSON",
          "status": "CONFIRMED",
          "caregiverNotes": "Rahul Sharma accompanying father. Wheelchair confirmed at Entrance Gate 2."
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T15:58:00.010Z",
      "requestId": "req_01HJ90R456M8K1V3R9X2P4L7N0"
    }
  }
  ```
- **Error Codes:**
  - `403 Forbidden`: `UNAUTHORIZED_CAREGIVER_ACCESS`

---

## 13. ADMIN ENDPOINTS

### 13.1 List All Partner Hospitals (Admin Directory)
- **Method / Path:** `GET /api/v1/admin/hospitals`
- **Description:** System administrator endpoint to view and audit all onboarded medical centers, clinics, and hospital networks.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`
- **Query Parameters:**
  ```typescript
  interface AdminHospitalListQuery {
    verificationStatus?: 'VERIFIED' | 'PENDING_AUDIT' | 'SUSPENDED';
    city?: string;
    cursor?: string;
    limit?: number;
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "hospitals": [
        {
          "id": "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X2",
          "name": "Apollo Hospitals, Bannerghatta Road",
          "legalEntityName": "Apollo Hospitals Enterprise Limited",
          "city": "Bengaluru",
          "state": "Karnataka",
          "activeDoctorsCount": 48,
          "activeElderPatientsRegistered": 320,
          "hasGeriatricCareWing": true,
          "verificationStatus": "VERIFIED",
          "onboardedAt": "2025-06-15T10:00:00.000Z"
        },
        {
          "id": "hsp_01HJ8ZP876M3N2P4R8L1W9Q5X8",
          "name": "Fortis Memorial Research Institute (FMRI)",
          "legalEntityName": "Fortis Healthcare Ltd.",
          "city": "Gurugram",
          "state": "Haryana",
          "activeDoctorsCount": 35,
          "activeElderPatientsRegistered": 215,
          "hasGeriatricCareWing": true,
          "verificationStatus": "VERIFIED",
          "onboardedAt": "2025-08-01T11:30:00.000Z"
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T16:00:00.010Z",
      "requestId": "req_01HJ90S123M2K8V4R1X7P9L3N5",
      "pagination": {
        "nextCursor": null,
        "prevCursor": null,
        "hasMore": false,
        "limit": 20,
        "totalCount": 2
      }
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`
  - `403 Forbidden`: `ADMIN_ROLE_REQUIRED`

---

### 13.2 Onboard New Partner Hospital
- **Method / Path:** `POST /api/v1/admin/hospitals`
- **Description:** Onboards and registers a new accredited hospital network, assigns nodal admin credentials, and configures emergency ambulance dispatch hooks.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `SUPER_ADMIN`
- **Request Body:**
  ```typescript
  interface OnboardHospitalRequest {
    name: string;                               // "Max Super Speciality Hospital, Saket"
    legalEntityName: string;                    // "Max Healthcare Institute Limited"
    clinicalEstablishmentRegNo: string;         // "DEL-HSP-2018-9941"
    address: {
      line1: string;                            // "1, 2, Press Enclave Road, Saket"
      city: string;                             // "New Delhi"
      state: string;                            // "Delhi"
      pincode: string;                          // "110017"
      country: string;                          // "India"
      coordinates: { latitude: number; longitude: number };
    };
    contactPhone: string;                       // "+911126515050"
    emergencyHotline: string;                   // "+911140554055"
    accreditations: Array<'NABH' | 'JCI' | 'NABL'>;
    adminContact: {
      name: string;                             // "Dr. Sunjay Kaul"
      email: string;                            // "admin.saket@maxhealthcare.com"
      phone: string;                            // "+919810123456"
    };
    hasGeriatricCareUnit: boolean;              // true
  }
  ```
- **Response Body (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "hospital": {
        "id": "hsp_01HJ90T891M4N2P8R1L5W7Q3X0",
        "name": "Max Super Speciality Hospital, Saket",
        "legalEntityName": "Max Healthcare Institute Limited",
        "city": "New Delhi",
        "verificationStatus": "VERIFIED",
        "adminAccountCreated": {
          "email": "admin.saket@maxhealthcare.com",
          "tempPasswordDispatched": true
        },
        "createdAt": "2026-11-23T16:02:00.000Z"
      }
    },
    "meta": {
      "timestamp": "2026-11-23T16:02:00.060Z",
      "requestId": "req_01HJ90T893M1K9V2R8X4P6L1N8"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `VALIDATION_FAILED`, `REGISTRATION_NUMBER_DUPLICATE`
  - `403 Forbidden`: `ADMIN_ROLE_REQUIRED`

---

### 13.3 Get Platform Analytics & Clinical Telemetry
- **Method / Path:** `GET /api/v1/admin/analytics`
- **Description:** System-wide macro metrics: active elderly citizens, daily caregiver engagement rate, prescription OCR success rate, and medication adherence benchmarks.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `SUPER_ADMIN`
- **Query Parameters:**
  ```typescript
  interface AnalyticsQuery {
    dateRange?: '7D' | '30D' | '90D' | '1Y';    // Default '30D'
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "period": "30D",
      "userMetrics": {
        "totalRegisteredElders": 8420,
        "activeCaregiversLinked": 11250,
        "registeredDoctors": 412,
        "partnerHospitals": 38
      },
      "clinicalOperations": {
        "prescriptionsProcessedByAiOcr": 14200,
        "ocrAccuracyRatePercentage": 98.4,
        "consultationsConducted": 5890,
        "inPersonOpdCount": 4210,
        "videoTeleconsultCount": 1680
      },
      "medicationAndVitals": {
        "dailyDosesScheduled": 33680,
        "platformAverageAdherenceRate": 92.8,
        "vitalReadingsIngested": 184500,
        "hypertensiveCrisisAlertsTriggered": 142,
        "sosEmergencyDispatches": 18
      },
      "refillLogistics": {
        "doorstepRefillOrdersFulfilled": 4320,
        "averageDeliveryTimeHours": 3.4,
        "topPartner": "Apollo Pharmacy (62%)"
      }
    },
    "meta": {
      "timestamp": "2026-11-23T16:05:00.015Z",
      "requestId": "req_01HJ90U456M8K3V9R2X1P7L5N4"
    }
  }
  ```
- **Error Codes:**
  - `403 Forbidden`: `ADMIN_ROLE_REQUIRED`

---

### 13.4 Get Subscriptions & Revenue Metrics
- **Method / Path:** `GET /api/v1/admin/subscriptions`
- **Description:** Monitors ElderGuardian recurring subscription health: Family Care Plans, Senior Citizen 24x7 SOS Tiers, Monthly Recurring Revenue (MRR), and renewal churn.
- **Authentication:** Required (`Bearer <access_token>`)
- **Authorized Roles:** `SUPER_ADMIN`
- **Query Parameters:**
  ```typescript
  interface SubscriptionsQuery {
    planTier?: 'FAMILY_CARE_ANNUAL' | 'SENIOR_SOS_PRO' | 'HOSPITAL_ENTERPRISE';
    status?: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
    cursor?: string;
    limit?: number;
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "financialSummary": {
        "currency": "INR",
        "mrr": 5840000,
        "arr": 70080000,
        "activePayingSubscriptions": 5240,
        "churnRatePercentage": 1.2
      },
      "subscriptionPlans": [
        {
          "planId": "pln_family_care_annual",
          "name": "ElderGuardian Family Care Plan (Annual)",
          "priceINR": 9999,
          "billingCycle": "YEARLY",
          "activeSubscribers": 3820,
          "featuresIncluded": [
            "Unlimited AI Prescription OCR & Digitization",
            "Doorstep Medication Auto-Refill with 15% discount",
            "Up to 4 Caregivers per Elder",
            "Automated Caregiver WhatsApp Vitals & Adherence Reports"
          ]
        },
        {
          "planId": "pln_senior_sos_pro",
          "name": "Senior Citizen 24x7 SOS & Emergency Ambulance Care",
          "priceINR": 1499,
          "billingCycle": "MONTHLY",
          "activeSubscribers": 1420,
          "featuresIncluded": [
            "Dedicated 24x7 Paramedic Emergency Dispatch Hotline",
            "Smart Fall-Detection Gateway Device Integration",
            "Priority Senior Citizen OPD Booking at Partner Hospitals"
          ]
        }
      ]
    },
    "meta": {
      "timestamp": "2026-11-23T16:06:00.020Z",
      "requestId": "req_01HJ90V123M4K8V1R7X3P2L9N6",
      "pagination": {
        "nextCursor": null,
        "prevCursor": null,
        "hasMore": false,
        "limit": 20,
        "totalCount": 2
      }
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: `UNAUTHORIZED`
  - `403 Forbidden`: `ADMIN_ROLE_REQUIRED`
