import { prisma } from "config/client";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { comparePassword, getUserSumCart, getUserWithRoleById } from "services/user/auth.service";
// import { getUserWithRoleById } from "services/client/auth.service";
// import { comparePassword, getUserById } from "services/user.service";

const configPassportLocal = () => {
    passport.use(new LocalStrategy({
        usernameField: "email",
        passReqToCallback: true
    }, async function verify(req, username, password, callback) {
        // reset messages error
        const { session } = req as any;
        if (session?.message?.length) {
            session.message = []
        }

        // check user exist in database
        const user = await prisma.user.findUnique(
            { where: { username: username } }
        );
        if (!user) {
            // throw new Error(`Username: ${username} not found!!`);
            return callback(null, false, { message: `Username/password invalid!!` });
        }
        // compare password
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            // throw new Error(`Invalid password!!`);
            return callback(null, false, { message: `Username/password invalid!!` });
        }

        return callback(null, user as any);
    }));

    passport.serializeUser(function (user: any, callback) {
        callback(null, { id: user.id, username: user.username});
    });

    // ho tro ghi thong tin nguoi dung vao req
    passport.deserializeUser(async function (user: any, callback) {
        const { id, username } = user;
        //query to database
        const userInDB: any = await getUserWithRoleById(id);
        const sumCart = await getUserSumCart(id);
        // console.log(userInDB);
        // console.log("sumCart: " + sumCart);
        return callback(null, {...userInDB, sumCart: sumCart});

    });
}

export { configPassportLocal }