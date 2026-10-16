import { route, aiConfigured } from '../_lib.js';

// Reports whether the server has AI and Supabase configured. Exposes no secrets.
export default route('GET', async () => aiConfigured());
