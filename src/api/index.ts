// Clean API exports - no more conflicts
import apiService from './apiService';

// Export Firebase components from our single source
export {app, auth, firestore, storage} from './firebase';

// Export the main API service
export default apiService;
