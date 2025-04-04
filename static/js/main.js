document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');

    // Funktion zum Abrufen des CSRF-Tokens
    function getCsrfToken() {
        return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    }

    // Funktion zum Abrufen des Themas vom Server
    function fetchTheme() {
        fetch('/account/get/theme/')
            .then(response => response.json())
            .then(data => {
                const savedTheme = data.theme;
                document.documentElement.setAttribute('data-theme', savedTheme);
                themeToggle.textContent = savedTheme === 'classic-dark' ? '🌜' : '🌞';
            })
            .catch(error => console.error('Error fetching theme:', error));
    }

    // Funktion zum Setzen des Themas auf dem Server
    function updateTheme(newTheme) {
        fetch('/account/set/theme/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ theme: newTheme })
        })
            .then(response => response.json())
            .catch(error => console.error('Error updating theme:', error));
    }

    // Beim Laden der Seite das gespeicherte Thema anwenden
    fetchTheme();

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'classic' ? 'classic-dark' : 'classic';
            document.documentElement.setAttribute('data-theme', newTheme);
            updateTheme(newTheme); // Thema auf dem Server aktualisieren

            themeToggle.textContent = newTheme === 'classic-dark' ? '🌜' : '🌞';
        });
    } else {
        console.error('Element with ID "theme-toggle" not found.');
    }
});