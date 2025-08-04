// frontend/src/pages/FormBuilder.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  TextFields as TextFieldsIcon,
  CheckBox as CheckBoxIcon,
  RadioButtonChecked as RadioIcon,
  CalendarToday as DateIcon,
  AttachFile as FileIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: any;
}

interface FormSection {
  id: string;
  title: string;
  fields: string[]; // Field IDs
}

interface FormData {
  fields: FormField[];
  sections: FormSection[];
  settings: {
    requireSignature: boolean;
    allowSave: boolean;
    showProgress: boolean;
    confirmationMessage?: string;
  };
}

const fieldTypes = [
  { type: 'text', label: 'Text Field', icon: <TextFieldsIcon /> },
  { type: 'email', label: 'Email', icon: <TextFieldsIcon /> },
  { type: 'phone', label: 'Phone', icon: <TextFieldsIcon /> },
  { type: 'date', label: 'Date', icon: <DateIcon /> },
  { type: 'select', label: 'Dropdown', icon: <CheckBoxIcon /> },
  { type: 'radio', label: 'Radio Buttons', icon: <RadioIcon /> },
  { type: 'checkbox', label: 'Checkbox', icon: <CheckBoxIcon /> },
  { type: 'textarea', label: 'Text Area', icon: <TextFieldsIcon /> },
  { type: 'file', label: 'File Upload', icon: <FileIcon /> },
  { type: 'signature', label: 'Signature', icon: <TextFieldsIcon /> },
];

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showNotification } = useNotification();
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('custom');
  const [formData, setFormData] = useState<FormData>({
    fields: [],
    sections: [{ id: 'section-1', title: 'General Information', fields: [] }],
    settings: {
      requireSignature: true,
      allowSave: true,
      showProgress: true,
    },
  });
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load existing form if editing
  const { data: existingForm } = useQuery(
    ['form', id],
    async () => {
      if (!id) return null;
      const response = await api.get(`/forms/${id}`);
      return response.data;
    },
    { enabled: !!id }
  );

  useEffect(() => {
    if (existingForm) {
      setFormName(existingForm.name);
      setFormDescription(existingForm.description || '');
      setFormType(existingForm.formType);
      setFormData(existingForm.formData);
    }
  }, [existingForm]);

  const saveMutation = useMutation(
    async (data: any) => {
      if (id) {
        return api.put(`/forms/${id}`, data);
      } else {
        return api.post('/forms', data);
      }
    },
    {
      onSuccess: () => {
        showNotification('Form saved successfully', 'success');
        navigate('/forms');
      },
      onError: () => {
        showNotification('Failed to save form', 'error');
      },
    }
  );

  const handleSave = () => {
    if (!formName) {
      showNotification('Please enter a form name', 'error');
      return;
    }

    saveMutation.mutate({
      name: formName,
      description: formDescription,
      formType,
      formData,
    });
  };

  const addField = (type: string) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `New ${type} field`,
      required: false,
    };

    if (type === 'select' || type === 'radio' || type === 'checkbox-group') {
      newField.options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];
    }

    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
      sections: prev.sections.map((section, index) =>
        index === 0
          ? { ...section, fields: [...section.fields, newField.id] }
          : section
      ),
    }));

    setSelectedField(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    }));
  };

  const deleteField = (fieldId: string) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((field) => field.id !== fieldId),
      sections: prev.sections.map((section) => ({
        ...section,
        fields: section.fields.filter((id) => id !== fieldId),
      })),
    }));
    setSelectedField(null);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceSectionIndex = parseInt(source.droppableId.split('-')[1]);
    const destSectionIndex = parseInt(destination.droppableId.split('-')[1]);

    setFormData((prev) => {
      const newSections = [...prev.sections];
      const [removed] = newSections[sourceSectionIndex].fields.splice(source.index, 1);
      newSections[destSectionIndex].fields.splice(destination.index, 0, removed);
      return { ...prev, sections: newSections };
    });
  };

  const selectedFieldData = formData.fields.find((f) => f.id === selectedField);

  return (
    <Box display="flex" height="calc(100vh - 64px)">
      {/* Left Sidebar - Field Types */}
      <Box width={280} bgcolor="background.paper" borderRight={1} borderColor="divider" p={2}>
        <Typography variant="h6" gutterBottom>
          Add Fields
        </Typography>
        <List>
          {fieldTypes.map((fieldType) => (
            <ListItem
              key={fieldType.type}
              button
              onClick={() => addField(fieldType.type)}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon>{fieldType.icon}</ListItemIcon>
              <ListItemText primary={fieldType.label} />
            </ListItem>
          ))}
        </List>
       </Box>
    

      {/* Main Content - Form Builder */}
      <Box flex={1} p={3} overflow="auto">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/forms')}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <TextField
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Form Name"
                variant="standard"
                sx={{
                  '& .MuiInput-input': {
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                  },
                }}
              />
              <TextField
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Add description"
                variant="standard"
                fullWidth
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saveMutation.isLoading}
            >
              {saveMutation.isLoading ? 'Saving...' : 'Save Form'}
            </Button>
          </Box>
        </Box>

        <Card>
          <CardContent>
            <DragDropContext onDragEnd={onDragEnd}>
              {formData.sections.map((section, sectionIndex) => (
                <Box key={section.id} mb={3}>
                  <Typography variant="h6" gutterBottom>
                    {section.title}
                  </Typography>
                  <Droppable droppableId={`section-${sectionIndex}`}>
                    {(provided) => (
                      <Box ref={provided.innerRef} {...provided.droppableProps}>
                        {section.fields.map((fieldId, index) => {
                          const field = formData.fields.find((f) => f.id === fieldId);
                          if (!field) return null;

                          return (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                              {(provided, snapshot) => (
                                <Paper
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  sx={{
                                    p: 2,
                                    mb: 2,
                                    backgroundColor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                                    border: selectedField === field.id ? 2 : 1,
                                    borderColor: selectedField === field.id ? 'primary.main' : 'divider',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => setSelectedField(field.id)}
                                >
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Box {...provided.dragHandleProps}>
                                      <DragIcon color="action" />
                                    </Box>
                                    <Box flex={1}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        {field.label}
                                        {field.required && (
                                          <Chip label="Required" size="small" sx={{ ml: 1 }} />
                                        )}
                                      </Typography>
                                      <Typography variant="body2" color="textSecondary">
                                        {field.type} field
                                      </Typography>
                                    </Box>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteField(field.id);
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Paper>
                              )}
                              </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                  {section.fields.length === 0 && (
                    <Box
                      p={4}
                      textAlign="center"
                      border={2}
                      borderColor="divider"
                      sx={{ borderStyle: 'dashed' }}
                      borderRadius={1}
                    >
                      <Typography color="textSecondary">
                        Drag fields here or click a field type to add
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </DragDropContext>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
export default FormBuilder;