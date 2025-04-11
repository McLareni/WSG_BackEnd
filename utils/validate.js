module.exports = {
    isValidEmail: (email) => {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(email);
    },

    isValidPassword: (password) => {
        return password.length >= 6; // Перевірка мінімальної довжини пароля
    },

    isValidNrAlbumu: (nr_albumu) => {
        // Тут ми перевіряємо, чи є числом
        return !isNaN(nr_albumu); // Перевірка чи це дійсно число
    }
};
