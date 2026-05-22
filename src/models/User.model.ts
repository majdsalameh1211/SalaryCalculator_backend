// src/models/User.model.ts
import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export interface IUser extends Document {
    username: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username must be at most 30 characters']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters']
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_, ret: any) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                delete ret.password; // never expose password in responses
                return ret;
            }
        }
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);