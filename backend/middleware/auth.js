const jwt = require('jsonwebtoken');

module.exports = {
    protect: (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ message: 'No authentication token, authorization denied' });
            }

            const verified = jwt.verify(token, process.env.JWT_SECRET);
            if (!verified) {
                return res.status(401).json({ message: 'Token verification failed, authorization denied' });
            }

            req.user = verified;
            next();
        } catch (err) {
            res.status(401).json({ message: 'Invalid token', error: err.message });
        }
    },
    isAdmin: (req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied: Requires Admin role' });
        }
    }
};
