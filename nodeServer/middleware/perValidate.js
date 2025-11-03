// 🧩 Middleware to restrict access based on user role
export const perValidate = (allowedRoles = []) => {
    return (req, res, next) => {
        try {
            const userRole = req.user?.role;
            if (!userRole) {
                return res.status(403).json({ success: false, message: "No role found. Access denied." });
            }

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({ success: false, message: "You do not have permission to access this resource." });
            }

            next();
        } catch (err) {
            res.status(500).json({ success: false, message: "Authorization error." });
        }
    };
};
