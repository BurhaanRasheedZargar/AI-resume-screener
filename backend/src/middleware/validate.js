const validate = (schemas) => (req, res, next) => {
    try {
        if (schemas.body) req.body = schemas.body.parse(req.body);
        if (schemas.params) req.params = schemas.params.parse(req.params);
        if (schemas.query) Object.assign(req.query, schemas.query.parse(req.query));
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = validate;
