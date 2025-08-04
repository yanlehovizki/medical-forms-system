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