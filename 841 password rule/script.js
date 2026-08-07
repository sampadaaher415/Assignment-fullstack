function checkPassword() {

    let password = document.getElementById("password").value;
    let result = document.getElementById("result");
    let rule = document.getElementById("rule");

    let upper = /[A-Z]/.test(password);
    let lower = /[a-z]/.test(password);
    let number = /[0-9]/.test(password);
    let special = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    let space = /\s/.test(password);

    let weakPasswords = [
        "password",
        "password123",
        "admin",
        "admin123",
        "welcome",
        "qwerty",
        "abc123",
        "12345678",
        "sampada",
        "sampada123",
        "sampada@123",
        "sampada@303"
    ];

    let pass = password.toLowerCase();

    // Hide rule first
    rule.style.display = "none";

    if (password.length < 8) {
        result.innerHTML = "❌ Password must contain at least 8 characters.";
        result.style.color = "red";
        rule.style.display = "block";
        return;
    }

    if (space) {
        result.innerHTML = "❌ Password should not contain spaces.";
        result.style.color = "red";
        rule.style.display = "block";
        return;
    }

    if (!upper) {
        result.innerHTML = "❌ Add at least one uppercase letter.";
        result.style.color = "red";
        rule.style.display = "block";
        return;
    }

    if (!lower) {
        result.innerHTML = "❌ Add at least one lowercase letter.";
        result.style.color = "red";
        rule.style.display = "block";
        return;
    }

    if (!number) {
        result.innerHTML = "❌ Add at least one number.";
        result.style.color = "red";
        rule.style.display = "block";
        return;
    }

    if (!special) {
        result.innerHTML = "❌ Add at least one special character.";
        result.style.color = "red";
        rule.style.display = "block";
        return;
    }

    if (weakPasswords.includes(pass)) {

        result.innerHTML =
         "⚠ Weak Password!<br><br>" +
        "Your password follows the format but it is easy to guess.<br>" +
        "Choose a unique password instead of names or common words.<br><br>" +
        "<b>Follow the 841 Rule:</b><br>" +
        "8 = Minimum 8 characters<br>" +
        "4 = Uppercase + Lowercase + Number + Special Character<br>" +
        "1 = Avoid common names and easy combinations.";

        result.style.color = "orange";

        rule.style.display = "block";

        return;
    }

    result.innerHTML = "✅ Strong Password";
    result.style.color = "green";

    rule.style.display = "none";
}