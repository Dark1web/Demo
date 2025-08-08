# Real-time Dashboard with Maps Integration

A comprehensive real-time dashboard application with advanced maps integration, GPS tracking, and WebSocket-based live updates. Built with React, Python FastAPI, Node.js, and Leaflet maps.

## 🚀 Features

### Core Features
- **Real-time Data Updates**: WebSocket-based live data streaming
- **Advanced Maps Integration**: Leaflet maps with search functionality
- **GPS Location Tracking**: Real-time location tracking with accuracy metrics
- **User Authentication**: Email-based login with JWT tokens
- **Responsive Design**: Modern UI with Tailwind CSS
- **Real-time Notifications**: Live activity feed and alerts

### Dashboard Components
- **Overview**: Real-time metrics and analytics
- **Maps**: Interactive maps with location search and tracking
- **Activity Feed**: Live updates and notifications
- **GPS Tracker**: Location tracking with history
- **Settings**: User preferences and system configuration

### Technical Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Python FastAPI, Node.js Express
- **Maps**: Leaflet.js with OpenStreetMap
- **Real-time**: WebSocket connections
- **Database**: SQLite (Python), PostgreSQL (Node.js)
- **Authentication**: JWT tokens

## 📋 Prerequisites

- Node.js 18+ 
- Python 3.8+
- npm or yarn
- Git

## 🛠️ Installation

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dark1web/Demo.git
   cd Demo
   ```

2. **Run the startup script**
   ```bash
   ./start.sh
   ```

   This will automatically:
   - Install all dependencies
   - Set up Python virtual environment
   - Start all services

### Manual Installation

#### Frontend Setup
```bash
npm install
npm run dev
```

#### Python Backend Setup
```bash
cd backend/python-api
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### Node.js Backend Setup
```bash
cd backend/node-data-pipeline
npm install
npm start
```

## 🌐 Access Points

After starting all services:

- **Frontend**: http://localhost:5173
- **Python API**: http://localhost:8000
- **Node.js API**: http://localhost:3001
- **API Documentation**: http://localhost:8000/docs

## 🗺️ Maps Features

### Search Functionality
- Search for any location worldwide
- Real-time search results with coordinates
- Click to center map on selected location

### GPS Integration
- Real-time GPS tracking
- Location history with timestamps
- Accuracy metrics and visualization
- Export location data

### Interactive Features
- Custom markers for user locations
- Popup information for each location
- Real-time location updates
- Accuracy circles for GPS tracking

## 🔐 Authentication

### Registration
- Email-based registration
- Password strength validation
- Form validation with error handling

### Login
- Secure JWT-based authentication
- Remember me functionality
- Social login options (Google, Twitter)

## 📊 Real-time Features

### WebSocket Connections
- Live data streaming
- Real-time location updates
- Instant notification delivery
- Connection status monitoring

### Dashboard Metrics
- Live updating metrics
- Real-time charts and graphs
- Activity monitoring
- System status indicators

## 🎨 UI/UX Features

### Modern Design
- Clean, responsive interface
- Smooth animations with Framer Motion
- Dark/light theme support
- Mobile-friendly design

### Interactive Components
- Real-time status indicators
- Loading states and transitions
- Toast notifications
- Modal dialogs

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Python Backend
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./dashboard.db

# Node.js Backend
DB_USER=postgres
DB_HOST=localhost
DB_NAME=dashboard_db
DB_PASSWORD=password
DB_PORT=5432
```

### GPS Settings
- High accuracy mode
- Configurable update intervals
- History size limits
- Export functionality

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interface
- GPS location access
- Mobile-optimized maps

## 🔒 Security Features

- JWT token authentication
- Password hashing
- CORS protection
- Input validation
- XSS protection

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the dist folder to your hosting service
```

### Backend Deployment
```bash
# Python Backend
cd backend/python-api
pip install -r requirements.txt
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker

# Node.js Backend
cd backend/node-data-pipeline
npm install
npm start
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   lsof -i :8000
   # Kill the process
   kill -9 <PID>
   ```

2. **Python dependencies not found**
   ```bash
   cd backend/python-api
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Node modules missing**
   ```bash
   npm install
   cd backend/node-data-pipeline && npm install
   ```

4. **GPS not working**
   - Ensure HTTPS is enabled for production
   - Check browser permissions
   - Verify device GPS is enabled

## 📈 Performance

- Optimized bundle size
- Lazy loading for components
- Efficient WebSocket connections
- Cached map tiles
- Compressed API responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at http://localhost:8000/docs
- Review the troubleshooting section above

## 🔄 Updates

Stay updated with the latest features:
```bash
git pull origin main
npm install
./start.sh
```

---

**Built with ❤️ using React, Python, Node.js, and Leaflet**
