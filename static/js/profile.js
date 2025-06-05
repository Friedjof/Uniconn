/**
 * Profile page JavaScript functionality
 * Handles theme switching and other profile-related interactions
 */

function applyTheme() {
    const themeSelect = document.getElementById('id_theme');
    const selectedTheme = themeSelect.value;
    
    // Get CSRF token
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch('/account/set-theme/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            theme: selectedTheme
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            location.reload(); // Reload to apply the new theme
        }
    })
    .catch(error => {
        console.error('Error applying theme:', error);
    });
}

// Initialize any additional profile page functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add any additional initialization code here
});
