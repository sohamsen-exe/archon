const roleSelect = document.getElementById('role');
const sharedDetails = document.getElementById('shared-details');
const studentIdContainer = document.getElementById('student-id-container');
const facultyIdContainer = document.getElementById('faculty-id-container');
const adminIdContainer = document.getElementById('admin-id-container');

if (roleSelect) {
    roleSelect.addEventListener('change', () => {
        const selectedRole = roleSelect.value;

        // Show Full Name & Department only for Student and Faculty
        sharedDetails.style.display = (selectedRole === 'user' || selectedRole === 'faculty') ? 'block' : 'none';

        // Toggle specific ID fields
        studentIdContainer.style.display = (selectedRole === 'user') ? 'block' : 'none';
        facultyIdContainer.style.display = (selectedRole === 'faculty') ? 'block' : 'none';
        adminIdContainer.style.display = (selectedRole === 'admin') ? 'block' : 'none';
    });
}

document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const role = document.getElementById('role').value;
    
    // Base payload
    const payload = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: role
    };

    // Attach specific fields based on role
    if (role === 'user' || role === 'faculty') {
        payload.fullName = document.getElementById('fullName').value;
        payload.department = document.getElementById('department').value;
    }

    if (role === 'user') payload.studentId = document.getElementById('studentId').value;
    if (role === 'faculty') payload.facultyId = document.getElementById('facultyId').value;
    if (role === 'admin') payload.adminId = document.getElementById('adminId').value;

    try {
        const res = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            window.location.href = 'login.html';
        } else {
            const error = await res.json();
            alert(`Signup failed: ${error.message}`);
        }
    } catch (err) {
        console.error('Signup error:', err);
    }
});

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Change button text to show it's working
    const submitBtn = e.target.querySelector('button');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Checking...";
    submitBtn.disabled = true;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include' // Crucial for cookies!
        });
        
        if (res.ok) {
            const data = await res.json();
            // Store the role and redirect
            localStorage.setItem('role', data.role);
            window.location.href = 'dashboard.html';
        } else {
            // If the server rejected the login, find out exactly why
            const errorData = await res.json();
            alert(`Login Failed: ${errorData.message}`);
        }
    } catch (err) {
        console.error("Network or Fetch Error:", err);
        alert("Cannot connect to the server. Is your Node.js backend running?");
    } finally {
        // Reset the button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});