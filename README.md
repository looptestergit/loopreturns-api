# LoopReturns Vercel API

### Endpoints

POST /api/store  
Stores parsed + raw LoopReturns JSON + user metadata.

GET /api/list  
Returns all stored records sorted by date.

---

### Environment Variables (Vercel)

Set:

MONGO_URI=your_mongodb_atlas_uri

---

### Folder Structure

/api/store.js  
/api/list.js  
/lib/mongo.js  
/package.json  
/.env.example  
