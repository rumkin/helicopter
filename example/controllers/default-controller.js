module.exports = {
    echo (req, res) {
        res.end(req.query.text);
    }
};
