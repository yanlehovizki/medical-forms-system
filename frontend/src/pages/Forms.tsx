// frontend/src/pages/Forms.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  FileCopy as FileCopyIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface Form {
  id: string;
  name: string;
  description: string;
  formType: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    submissions: number;
  };
}

const Forms: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const { data: forms, isLoading } = useQuery<Form[]>(
    ['forms', selectedTab, searchTerm],
    async () => {
      const params = new URLSearchParams();
      if (selectedTab === 1) params.append('status', 'active');
      if (selectedTab === 2) params.append('status', 'inactive');
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await api.get(`/forms?${params}`);
      return response.data;
    }
  );

  const { data: templates } = useQuery({
  queryKey: ['formTemplates'],
  queryFn: async () => {
    const response = await api.get('/forms/templates/list');
    return response.data;
  }
});

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/forms/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['forms'] });
        showNotification('Form deleted successfully', 'success');
        setDeleteDialogOpen(false);
      },
      onError: () => {
        showNotification('Failed to delete form', 'error');
      },
    }
  );

  const duplicateMutation = useMutation(
    async (id: string) => {
      await api.post(`/forms/${id}/duplicate`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['forms'] });
        showNotification('Form duplicated successfully', 'success');
      },
      onError: () => {
        showNotification('Failed to duplicate form', 'error');
      },
    }
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, form: Form) => {
    setAnchorEl(event.currentTarget);
    setSelectedForm(form);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (selectedForm) {
      navigate(`/forms/${selectedForm.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDuplicate = () => {
    if (selectedForm) {
      duplicateMutation.mutate(selectedForm.id);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = () => {
    if (selectedForm) {
      deleteMutation.mutate(selectedForm.id);
    }
  };

  const handleCreateFromTemplate = (templateId: string) => {
    navigate(`/forms/new?template=${templateId}`);
    setTemplateDialogOpen(false);
  };

  const getFormTypeColor = (type: string) => {
    const colors: Record<string, any> = {
      intake: 'primary',
      consent: 'secondary',
      medical_history: 'info',
      insurance: 'warning',
      custom: 'default',
    };
    return colors[type] || 'default';
  };

  const FormCard: React.FC<{ form: Form }> = ({ form }) => (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {form.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              {form.description || 'No description provided'}
            </Typography>
            <Box display="flex" gap={1} mb={2}>
              <Chip
                label={form.formType.replace('_', ' ')}
                size="small"
                color={getFormTypeColor(form.formType)}
              />
              <Chip
                label={`v${form.version}`}
                size="small"
                variant="outlined"
              />
              {form._count && (
                <Chip
                  label={`${form._count.submissions} submissions`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
            <Typography variant="caption" color="textSecondary">
              Updated {new Date(form.updatedAt).toLocaleDateString()}
            </Typography>
          </Box>
          <IconButton onClick={(e) => handleMenuOpen(e, form)}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Forms
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Create and manage your clinic forms
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setTemplateDialogOpen(true)}
          >
            Use Template
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/forms/new')}
          >
            Create Form
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box p={2}>
          <TextField
            fullWidth
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Tabs
          value={selectedTab}
          onChange={(_, value) => setSelectedTab(value)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Forms" />
          <Tab label="Active" />
          <Tab label="Inactive" />
        </Tabs>
      </Paper>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <Typography>Loading forms...</Typography>
        </Box>
      ) : forms && forms.length > 0 ? (
        <Grid container spacing={3}>
          {forms.map((form) => (
            <Grid item xs={12} md={6} lg={4} key={form.id}>
              <FormCard form={form} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography variant="h6" gutterBottom>
                No forms found
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Create your first form to start collecting patient information
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/forms/new')}
              >
                Create Form
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <FileCopyIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={() => navigate(`/forms/${selectedForm?.id}/preview`)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Preview
        </MenuItem>
        <MenuItem onClick={() => console.log('Share')}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Share Link
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Form</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedForm?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog 
        open={templateDialogOpen} 
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Choose a Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {templates && templates.map((template: any) => (
              <Grid item xs={12} sm={6} key={template.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => handleCreateFromTemplate(template.id)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {template.description}
                    </Typography>
                    <Chip 
                      label={template.type} 
                      size="small" 
                      sx={{ mt: 1 }}
                      color={getFormTypeColor(template.type)}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Forms;