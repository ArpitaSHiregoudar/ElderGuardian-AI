/**
 * Format and send a success response.
 *
 * @param {import('express').Response} res
 * @param {*} data       Payload to return
 * @param {number} [statusCode=200]
 * @param {object} [meta]  Extra metadata (pagination, etc.)
 */
function success(res, data, statusCode = 200, meta = {}) {
  res.status(statusCode).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.req?.id || null,
      ...meta,
    },
  });
}

/**
 * Format and send an error response.
 *
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {string} [code='INTERNAL_ERROR']
 * @param {*} [details]
 */
function error(res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = undefined) {
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(details ? { details } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.req?.id || null,
    },
  });
}

module.exports = { success, error };
