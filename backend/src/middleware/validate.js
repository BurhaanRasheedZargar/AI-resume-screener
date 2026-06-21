const validate = (schemas) => (req, res, next) => {
    try {
        if (schemas.body) req.body = schemas.body.parse(req.body);
        if (schemas.params) req.params = schemas.params.parse(req.params);
        if (schemas.query) {
            const value = schemas.query.parse(req.query);
            // Express 5's req.query is a getter that re-parses the query string on
            // every access, so a plain assignment would be lost. Redefine it so the
            // validated/coerced values (including defaults) reach the handlers.
            Object.defineProperty(req, 'query', { value, writable: true, configurable: true });
        }
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = validate;
