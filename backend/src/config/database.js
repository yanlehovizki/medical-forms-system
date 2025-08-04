// backend/src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Test connection
sequelize.authenticate()
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.error('Unable to connect to database:', err));

module.exports = sequelize;

// backend/src/models/index.js
const sequelize = require('../config/database');
const Clinic = require('./clinic.model');
const User = require('./user.model');
const Form = require('./form.model');
const Patient = require('./patient.model');
const FormSubmission = require('./submission.model');

// Define associations
Clinic.hasMany(User, { foreignKey: 'clinic_id' });
User.belongsTo(Clinic, { foreignKey: 'clinic_id' });

Clinic.hasMany(Form, { foreignKey: 'clinic_id' });
Form.belongsTo(Clinic, { foreignKey: 'clinic_id' });

Form.hasMany(FormSubmission, { foreignKey: 'form_id' });
FormSubmission.belongsTo(Form, { foreignKey: 'form_id' });

Patient.hasMany(FormSubmission, { foreignKey: 'patient_id' });
FormSubmission.belongsTo(Patient, { foreignKey: 'patient_id' });

// Sync database in development
if (process.env.NODE_ENV === 'development') {
    sequelize.sync({ alter: true })
        .then(() => console.log('Database synced'))
        .catch(err => console.error('Database sync error:', err));
}

module.exports = {
    sequelize,
    Clinic,
    User,
    Form,
    Patient,
    FormSubmission
};

// backend/src/models/clinic.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Clinic = sequelize.define('Clinic', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    subscriptionStatus: {
        type: DataTypes.ENUM('active', 'inactive', 'trial'),
        defaultValue: 'trial'
    },
    settings: {
        type: DataTypes.JSON,
        defaultValue: {
            allowPatientSignup: true,
            requireEmailVerification: true,
            autoSendReminders: true,
            reminderDaysBefore: 2
        }
    }
}, {
    tableName: 'clinics',
    timestamps: true,
    underscored: true
});

module.exports = Clinic;

// backend/src/models/user.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    clinicId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'clinic_id'
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'password_hash'
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'first_name'
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'last_name'
    },
    role: {
        type: DataTypes.ENUM('admin', 'staff', 'doctor'),
        defaultValue: 'staff'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login'
    }
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.passwordHash) {
                user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('passwordHash')) {
                user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
            }
        }
    }
});

// Instance method to validate password
User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.passwordHash);
};

// Instance method to get safe user data (without password)
User.prototype.toSafeObject = function() {
    const { passwordHash, ...safeUser } = this.toJSON();
    return safeUser;
};

module.exports = User;

// backend/src/models/form.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Form = sequelize.define('Form', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    clinicId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'clinic_id'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    formData: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
            fields: [],
            sections: [],
            settings: {}
        },
        field: 'form_data'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    version: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    formType: {
        type: DataTypes.ENUM('intake', 'consent', 'medical_history', 'insurance', 'custom'),
        defaultValue: 'custom',
        field: 'form_type'
    }
}, {
    tableName: 'forms',
    timestamps: true,
    underscored: true
});

module.exports = Form;