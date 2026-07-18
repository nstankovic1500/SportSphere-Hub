import { Schema, model, type Types } from 'mongoose';

enum UserRole {
  Athlete = 'athlete',
  Employee = 'employee',
  Admin = 'admin',
}

enum UserStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Blocked = 'blocked',
}

interface IEmployeeData {
  companyName?: string;
  headOfficeAddress?: string;
  registrationNumber?: string;
  pib?: string;
}

interface IUser {
  _id?: Types.ObjectId;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage?: string;
  favoriteSports?: Types.ObjectId[];
  role: UserRole;
  status: UserStatus;
  employeeData?: IEmployeeData;
  blockedFacilities?: Types.ObjectId[];
  createdAt?: Date;
}

const employeeDataSchema = new Schema<IEmployeeData>(
  {
    companyName: {
      type: String,
      trim: true,
    },
    headOfficeAddress: {
      type: String,
      trim: true,
    },
    registrationNumber: {
      type: String,
      match: [/^\d{8}$/, 'Registration number must contain exactly 8 digits'],
    },
    pib: {
      type: String,
      match: [/^[1-9]\d{8}$/, 'PIB must contain 9 digits and cannot start with 0'],
    },
  },
  {
    _id: false,
  },
);

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    profileImage: {
      type: String,
    },
    favoriteSports: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Sport' }],
      validate: {
        validator: (value: Types.ObjectId[] | undefined): boolean =>
          value === undefined || value.length <= 5,
        message: 'Favorite sports can contain at most 5 items',
      },
    },
    role: {
      type: String,
      required: true,
      enum: Object.values(UserRole),
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(UserStatus),
    },
    employeeData: {
      type: employeeDataSchema,
      required: false,
    },
    blockedFacilities: [{ type: Schema.Types.ObjectId, ref: 'Facility' }],
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: 'users',
  },
);

userSchema.pre('validate', function ensureEmployeeDataMatchesRole() {
  if (this.role === UserRole.Employee) {
    const hasEmployeeData =
      this.employeeData !== undefined &&
      this.employeeData.companyName !== undefined &&
      this.employeeData.headOfficeAddress !== undefined &&
      this.employeeData.registrationNumber !== undefined &&
      this.employeeData.pib !== undefined;

    if (!hasEmployeeData) {
      this.invalidate('employeeData', 'employeeData is required when role is employee');
    }
    return;
  }

  if (this.employeeData !== undefined) {
    this.employeeData = undefined;
  }
});

const User = model<IUser>('User', userSchema);

export { User, UserRole, UserStatus, type IEmployeeData, type IUser };
