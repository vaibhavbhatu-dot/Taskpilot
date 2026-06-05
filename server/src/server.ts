import app from './app';
import { startSupportCronJobs } from './jobs/support-auto-close';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 TaskPilot server running on port ${PORT}`);
  startSupportCronJobs();
});
