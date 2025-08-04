// backend/src/routes/form.routes.js
const express = require('express');
const router = express.Router();
const formController = require('../controllers/form.controller');
const { authorize } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');

// Get all forms for clinic
router.get('/', formController.getClinicForms);

// Get single form
router.get('/:id', 
    [param('id').isUUID().withMessage('Invalid form ID'), validate],
    formController.getForm
);

// Create new form
router.post('/',
    authorize('admin', 'doctor'),
    [
        body('name').notEmpty().withMessage('Form name is required'),
        body('formType').isIn(['intake', 'consent', 'medical_history', 'insurance', 'custom']),
        validate
    ],
    formController.createForm
);

// Update form
router.put('/:id',
    authorize('admin', 'doctor'),
    [param('id').isUUID().withMessage('Invalid form ID'), validate],
    formController.updateForm
);

// Delete form
router.delete('/:id',
    authorize('admin'),
    [param('id').isUUID().withMessage('Invalid form ID'), validate],
    formController.deleteForm
);

// Duplicate form
router.post('/:id/duplicate',
    authorize('admin', 'doctor'),
    [param('id').isUUID().withMessage('Invalid form ID'), validate],
    formController.duplicateForm
);

// Get form templates
router.get('/templates/list', formController.getFormTemplates);

module.exports = router;

// backend/src/controllers/form.controller.js
const { Form, Clinic } = require('../models');
const { Op } = require('sequelize');
const formTemplates = require('../utils/formTemplates');

exports.getClinicForms = async (req, res) => {
    try {
        const { clinicId } = req.user;
        const { status, type, search } = req.query;

        const where = { clinicId };
        
        if (status !== undefined) {
            where.isActive = status === 'active';
        }
        
        if (type) {
            where.formType = type;
        }
        
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const forms = await Form.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        res.json(forms);
    } catch (error) {
        console.error('Get forms error:', error);
        res.status(500).json({ error: 'Failed to fetch forms' });
    }
};

exports.getForm = async (req, res) => {
    try {
        const { id } = req.params;
        const { clinicId } = req.user;

        const form = await Form.findOne({
            where: { id, clinicId }
        });

        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        res.json(form);
    } catch (error) {
        console.error('Get form error:', error);
        res.status(500).json({ error: 'Failed to fetch form' });
    }
};

exports.createForm = async (req, res) => {
    try {
        const { clinicId } = req.user;
        const { name, description, formType, formData, templateId } = req.body;

        let initialFormData = formData;
        
        // If using template, load template data
        if (templateId && formTemplates[templateId]) {
            initialFormData = formTemplates[templateId].data;
        }

        const form = await Form.create({
            clinicId,
            name,
            description,
            formType,
            formData: initialFormData || {
                fields: [],
                sections: [{
                    id: 'section-1',
                    title: 'General Information',
                    fields: []
                }],
                settings: {
                    requireSignature: true,
                    allowSave: true,
                    showProgress: true
                }
            }
        });

        res.status(201).json(form);
    } catch (error) {
        console.error('Create form error:', error);
        res.status(500).json({ error: 'Failed to create form' });
    }
};

exports.updateForm = async (req, res) => {
    try {
        const { id } = req.params;
        const { clinicId } = req.user;
        const { name, description, formData, isActive } = req.body;

        const form = await Form.findOne({
            where: { id, clinicId }
        });

        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        // Increment version if form structure changes
        const updates = { name, description, isActive };
        if (formData && JSON.stringify(formData) !== JSON.stringify(form.formData)) {
            updates.formData = formData;
            updates.version = form.version + 1;
        }

        await form.update(updates);

        res.json(form);
    } catch (error) {
        console.error('Update form error:', error);
        res.status(500).json({ error: 'Failed to update form' });
    }
};

exports.deleteForm = async (req, res) => {
    try {
        const { id } = req.params;
        const { clinicId } = req.user;

        const form = await Form.findOne({
            where: { id, clinicId }
        });

        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        // Soft delete by deactivating
        await form.update({ isActive: false });

        res.json({ message: 'Form deleted successfully' });
    } catch (error) {
        console.error('Delete form error:', error);
        res.status(500).json({ error: 'Failed to delete form' });
    }
};

exports.duplicateForm = async (req, res) => {
    try {
        const { id } = req.params;
        const { clinicId } = req.user;

        const originalForm = await Form.findOne({
            where: { id, clinicId }
        });

        if (!originalForm) {
            return res.status(404).json({ error: 'Form not found' });
        }

        const newForm = await Form.create({
            clinicId,
            name: `${originalForm.name} (Copy)`,
            description: originalForm.description,
            formType: originalForm.formType,
            formData: originalForm.formData
        });

        res.status(201).json(newForm);
    } catch (error) {
        console.error('Duplicate form error:', error);
        res.status(500).json({ error: 'Failed to duplicate form' });
    }
};

exports.getFormTemplates = async (req, res) => {
    try {
        const templates = Object.entries(formTemplates).map(([id, template]) => ({
            id,
            name: template.name,
            description: template.description,
            type: template.type,
            preview: template.preview
        }));

        res.json(templates);
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};