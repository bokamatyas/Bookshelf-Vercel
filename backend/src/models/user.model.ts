import {Schema, model}  from "mongoose"
import { Logger } from "../tools/logger";

const userSchema = new Schema({
    username:{
        required: true,
        type: String,
        minLength: 1,
        maxLength: 100,
        unique: true
    },
    password_hashed:{
        required: true,
        type: String
    },
    email:{
        required: true,
        type: String,
        unique: true
    },
    created_at:{
        required: true,
        type: Date,
        default: Date.now
    },
    updated_at:{
        required: true,
        type: Date,
        default: Date.now
    },
    last_login:{
        required: true,
        type: Date,
        default: Date.now
    },
    role:{
        required: true,
        type: String,
        enum: ["admin","user","editor"]
    },
    booklist: {
        type: [{
          _id: false,
          book_id: { 
            type: Schema.Types.ObjectId, 
            ref: 'Book', 
            required: true 
          },
          read_status: {
            type: String,
            required: true,
            enum: ["to_read","has_read","is_reading","dropped","favorite"]
          },
          // ... other book-specific fields
        }],
        required: true,
        default: []
      },
    imageUrl:{
        required:false,
        type: String
    }
},{versionKey: false})


userSchema.pre("save", function (next) {
    // @ts-ignore
    if (this._updateContext === "update") {
        this.updated_at = new Date();
    }

    // @ts-ignore
    if (this._updateContext === "login") {
        this.last_login = new Date();
    }

    next();
});

userSchema.post("save",function(next){
    // @ts-ignore
    if (this._updateContext === "update") {
        Logger.info(`${this._id} user saved`)
    }
    
    // @ts-ignore
    if (this._updateContext === "login") {
        Logger.info(`${this._id} user saved`)
    }
})

module.exports = model("UserModel",userSchema,"users")