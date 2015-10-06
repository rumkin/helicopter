module.exports = {
    hello(req, res) {
        PrintService.print('hello');
        res.end('Hello');
    }
};
