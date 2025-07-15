import jwt from "jsonwebtoken"
import Types from "mysql2"

type UserPayload = {
    id: Types.TypeCastType,
    
}

export const generateJWT = (payload: UserPayload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: "1d",
    })
    return token;
}