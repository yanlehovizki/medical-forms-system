import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

interface DashboardStats {
  totalPatients: number;
  totalForms: number;
  completedToday: number;
  pendingSubmissions: number;
  weeklyTrend: number;
  completionRate: number;
}

interface ChartData {
  date: string;
  submissions: number;
  completed: number;
}

const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    }
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<ChartData[]>({
    queryKey: ['dashboardChart'],
    queryFn: async () => {
      const response = await api.get('/dashboard/chart-data');
      return response.data;
    }
  });

  const { data: recentSubmissions } = useQuery({
    queryKey: ['recentSubmissions'],
    queryFn: async () => {
      const response = await api.get('/submissions?limit=5');
      return response.data;
    }
  });

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: number;
    color: string;
  }> = ({ title, value, icon, trend, color }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {trend !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon 
                  sx={{ 
                    fontSize: 16, 
                    color: trend > 0 ? 'success.main' : 'error.main',
                    transform: trend < 0 ? 'rotate(180deg)' : 'none'
                  }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: trend > 0 ? 'success.main' : 'error.main',
                    ml: 0.5 
                  }}
                >
                  {Math.abs(trend)}% from last week
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.100`,
              borderRadius: 3,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon as React.ReactElement, {
              sx: { fontSize: 28, color: `${color}.main` }
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Welcome back! Here's what's happening with your forms today.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={stats?.totalPatients || 0}
            icon={<PeopleIcon />}
            color="primary"
            trend={stats?.weeklyTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Forms"
            value={stats?.totalForms || 0}
            icon={<DescriptionIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Today"
            value={stats?.completedToday || 0}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Review"
            value={stats?.pendingSubmissions || 0}
            icon={<DescriptionIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Submission Trends
              </Typography>
              <Box height={300}>
                {chartLoading ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <LinearProgress sx={{ width: '50%' }} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="submissions" 
                        stackId="1"
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6}
                        name="Total Submissions"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="completed" 
                        stackId="1"
                        stroke="#82ca9d" 
                        fill="#82ca9d"
                        fillOpacity={0.6}
                        name="Completed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Completion Rate
              </Typography>
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                height={250}
              >
                <Box position="relative" display="inline-flex">
                  <Box
                    sx={{
                      width: 180,
                      height: 180,
                      borderRadius: '50%',
                      background: `conic-gradient(#4caf50 0deg ${(stats?.completionRate || 0) * 3.6}deg, #e0e0e0 ${(stats?.completionRate || 0) * 3.6}deg 360deg)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 140,
                        height: 140,
                        borderRadius: '50%',
                        backgroundColor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography variant="h3" fontWeight="bold">
                        {stats?.completionRate || 0}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        This Week
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary" mt={2} textAlign="center">
                  Forms completed vs. started
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Submissions */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Recent Submissions
            </Typography>
            <IconButton size="small" color="primary">
              <ArrowForwardIcon />
            </IconButton>
          </Box>
          
          {recentSubmissions && recentSubmissions.length > 0 ? (
            <Box>
              {recentSubmissions.map((submission: any) => (
                <Paper
                  key={submission.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      cursor: 'pointer',
                    },
                  }}
                  elevation={0}
                  variant="outlined"
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {submission.patientName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {submission.formName} • {new Date(submission.submittedAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: 
                        submission.status === 'completed' ? 'success.100' : 
                        submission.status === 'pending' ? 'warning.100' : 
                        'grey.100',
                      color:
                        submission.status === 'completed' ? 'success.dark' : 
                        submission.status === 'pending' ? 'warning.dark' : 
                        'grey.dark',
                    }}
                  >
                    <Typography variant="caption" fontWeight="medium">
                      {submission.status.toUpperCase()}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center" 
              height={200}
              flexDirection="column"
            >
              <Typography variant="body1" color="textSecondary">
                No recent submissions
              </Typography>  
                <Typography variant="body2" color="textSecondary" mt={1}>
                Form submissions will appear here
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
export default Dashboard;