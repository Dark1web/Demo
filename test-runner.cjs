const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestSprite {
  constructor() {
    this.testResults = {
      frontend: {
        accessibility: [],
        performance: [],
        functionality: [],
        visual: []
      },
      backend: {
        api: [],
        database: [],
        security: [],
        performance: []
      },
      integration: [],
      userExperience: []
    };
    this.errors = [];
    this.warnings = [];
  }

  async runAllTests() {
    console.log('🚀 Starting TestSprite Comprehensive Testing Suite...\n');
    
    try {
      await this.checkFrontendStatus();
      await this.checkBackendStatus();
      await this.runFrontendTests();
      await this.runBackendTests();
      await this.runIntegrationTests();
      await this.runUserExperienceTests();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Test Suite Failed:', error.message);
      this.errors.push(error.message);
    }
  }

  async checkFrontendStatus() {
    console.log('📱 Checking Frontend Status...');
    return new Promise((resolve) => {
      exec('curl -f http://localhost:8080', (error, stdout, stderr) => {
        if (error) {
          this.errors.push('Frontend not accessible on port 8080');
          console.log('❌ Frontend not running on port 8080');
        } else {
          console.log('✅ Frontend is accessible');
        }
        resolve();
      });
    });
  }

  async checkBackendStatus() {
    console.log('⚙️  Checking Backend Status...');
    
    // Check Python API
    return new Promise((resolve) => {
      exec('curl -f http://localhost:8000/health', (error, stdout, stderr) => {
        if (error) {
          this.errors.push('Python API not accessible on port 8000');
          console.log('❌ Python API not running on port 8000');
        } else {
          console.log('✅ Python API is accessible');
        }
        
        // Check Node.js Pipeline
        exec('curl -f http://localhost:3001/health', (error2, stdout2, stderr2) => {
          if (error2) {
            this.errors.push('Node.js Pipeline not accessible on port 3001');
            console.log('❌ Node.js Pipeline not running on port 3001');
          } else {
            console.log('✅ Node.js Pipeline is accessible');
          }
          resolve();
        });
      });
    });
  }

  async runFrontendTests() {
    console.log('\n🎨 Running Frontend Tests...');
    
    // Accessibility Tests
    console.log('- Running Accessibility Tests...');
    await this.testAccessibility();
    
    // Performance Tests
    console.log('- Running Performance Tests...');
    await this.testPerformance();
    
    // Functionality Tests
    console.log('- Running Functionality Tests...');
    await this.testFunctionality();
    
    // Visual Tests
    console.log('- Running Visual Tests...');
    await this.testVisual();
  }

  async testAccessibility() {
    // Check for common accessibility issues
    const issues = [];
    
    // Check if HTML has proper structure
    if (fs.existsSync('./index.html')) {
      const html = fs.readFileSync('./index.html', 'utf8');
      if (!html.includes('lang=')) {
        issues.push('Missing lang attribute in HTML');
      }
      if (!html.includes('<title>')) {
        issues.push('Missing title tag');
      }
    }
    
    this.testResults.frontend.accessibility = issues;
    if (issues.length === 0) {
      console.log('  ✅ Basic accessibility checks passed');
    } else {
      console.log(`  ⚠️  Found ${issues.length} accessibility issues`);
    }
  }

  async testPerformance() {
    const issues = [];
    
    // Check bundle size
    if (fs.existsSync('./dist')) {
      console.log('  ✅ Build directory exists');
    } else {
      issues.push('No build directory found - run npm run build');
    }
    
    // Check for performance optimizations
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    if (!packageJson.dependencies['@vitejs/plugin-react-swc']) {
      issues.push('Consider using SWC for faster builds');
    }
    
    this.testResults.frontend.performance = issues;
    console.log(`  ${issues.length === 0 ? '✅' : '⚠️'} Performance checks completed`);
  }

  async testFunctionality() {
    const issues = [];
    
    // Check critical files exist
    const criticalFiles = [
      './src/App.tsx',
      './src/main.tsx',
      './src/components/LandingPage.tsx',
      './src/components/AdminDashboard.tsx',
      './src/components/UserDashboard.tsx'
    ];
    
    criticalFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        issues.push(`Missing critical file: ${file}`);
      }
    });
    
    // Check for TypeScript errors
    return new Promise((resolve) => {
      exec('npx tsc --noEmit', (error, stdout, stderr) => {
        if (error && stderr.includes('error')) {
          issues.push('TypeScript compilation errors found');
        }
        
        this.testResults.frontend.functionality = issues;
        console.log(`  ${issues.length === 0 ? '✅' : '❌'} Functionality checks completed`);
        resolve();
      });
    });
  }

  async testVisual() {
    const issues = [];
    
    // Check for CSS/styling files
    if (!fs.existsSync('./src/index.css')) {
      issues.push('Missing main CSS file');
    }
    
    // Check for responsive design indicators
    const appFile = fs.readFileSync('./src/App.tsx', 'utf8');
    if (!appFile.includes('mobile') && !appFile.includes('responsive')) {
      this.warnings.push('No obvious mobile/responsive design patterns found');
    }
    
    this.testResults.frontend.visual = issues;
    console.log(`  ${issues.length === 0 ? '✅' : '⚠️'} Visual checks completed`);
  }

  async runBackendTests() {
    console.log('\n🔧 Running Backend Tests...');
    
    await this.testAPI();
    await this.testDatabase();
    await this.testSecurity();
  }

  async testAPI() {
    const issues = [];
    
    // Check Python API structure
    const pythonFiles = [
      './backend/python-api/main.py',
      './backend/python-api/requirements.txt'
    ];
    
    pythonFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        issues.push(`Missing Python API file: ${file}`);
      }
    });
    
    // Check Node.js API structure
    const nodeFiles = [
      './backend/node-data-pipeline/package.json',
      './backend/node-data-pipeline/src/app.js'
    ];
    
    nodeFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        issues.push(`Missing Node.js file: ${file}`);
      }
    });
    
    this.testResults.backend.api = issues;
    console.log(`  ${issues.length === 0 ? '✅' : '❌'} API structure checks completed`);
  }

  async testDatabase() {
    const issues = [];
    
    // Check Supabase configuration
    if (fs.existsSync('./src/integrations/supabase/client.ts')) {
      const supabaseConfig = fs.readFileSync('./src/integrations/supabase/client.ts', 'utf8');
      if (supabaseConfig.includes('your_supabase_url')) {
        issues.push('Supabase URL not configured');
      }
      console.log('  ✅ Supabase client configuration found');
    } else {
      issues.push('Supabase client configuration missing');
    }
    
    this.testResults.backend.database = issues;
    console.log(`  ${issues.length === 0 ? '✅' : '❌'} Database checks completed`);
  }

  async testSecurity() {
    const issues = [];
    
    // Check for environment variables
    if (!fs.existsSync('./.env') && !fs.existsSync('./.env.example')) {
      issues.push('No environment configuration found');
    }
    
    // Check for security headers in main.py
    if (fs.existsSync('./backend/python-api/main.py')) {
      const mainPy = fs.readFileSync('./backend/python-api/main.py', 'utf8');
      if (!mainPy.includes('CORSMiddleware')) {
        issues.push('CORS middleware not configured');
      }
    }
    
    this.testResults.backend.security = issues;
    console.log(`  ${issues.length === 0 ? '✅' : '⚠️'} Security checks completed`);
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    
    const issues = [];
    
    // Test frontend-backend integration
    return new Promise((resolve) => {
      exec('curl -f http://localhost:8080 && curl -f http://localhost:8000', (error) => {
        if (error) {
          issues.push('Frontend-Backend integration not available for testing');
        } else {
          console.log('  ✅ Frontend and Backend both accessible');
        }
        
        this.testResults.integration = issues;
        resolve();
      });
    });
  }

  async runUserExperienceTests() {
    console.log('\n👤 Running User Experience Tests...');
    
    const issues = [];
    
    // Check for loading states
    const appFile = fs.readFileSync('./src/App.tsx', 'utf8');
    if (!appFile.includes('loading') && !appFile.includes('Loading')) {
      issues.push('No loading states found in main app');
    }
    
    // Check for error handling
    if (!appFile.includes('error') && !appFile.includes('Error')) {
      issues.push('No error handling found in main app');
    }
    
    // Check for responsive design
    if (!appFile.includes('mobile') && !appFile.includes('responsive')) {
      issues.push('No obvious mobile support in main app');
    }
    
    this.testResults.userExperience = issues;
    console.log(`  ${issues.length === 0 ? '✅' : '⚠️'} UX checks completed`);
  }

  async generateReport() {
    console.log('\n📊 Generating Test Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        status: this.errors.length === 0 ? 'PASSED' : 'FAILED'
      },
      results: this.testResults,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync('./test-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST REPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Status: ${report.summary.status}`);
    console.log(`Errors: ${report.summary.totalErrors}`);
    console.log(`Warnings: ${report.summary.totalWarnings}`);
    console.log(`Report saved to: test-report.json`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.errors.some(e => e.includes('Frontend not accessible'))) {
      recommendations.push('Start the frontend development server with "npm run dev"');
    }
    
    if (this.errors.some(e => e.includes('Python API not accessible'))) {
      recommendations.push('Start the Python API server in the backend/python-api directory');
    }
    
    if (this.errors.some(e => e.includes('Node.js Pipeline not accessible'))) {
      recommendations.push('Start the Node.js data pipeline in the backend/node-data-pipeline directory');
    }
    
    if (this.errors.some(e => e.includes('TypeScript compilation'))) {
      recommendations.push('Fix TypeScript errors before deployment');
    }
    
    if (this.warnings.some(w => w.includes('mobile'))) {
      recommendations.push('Consider adding explicit mobile/responsive design patterns');
    }
    
    return recommendations;
  }
}

// Run the tests
if (require.main === module) {
  const testSprite = new TestSprite();
  testSprite.runAllTests();
}

module.exports = TestSprite;