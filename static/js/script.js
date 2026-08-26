// =====================================
// LOGIN
// =====================================

async function loginUser() {

    console.log("Login button clicked");

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    console.log("Email:", email);

    const formData = new URLSearchParams();

    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData
    });

    console.log("Login status:", response.status);

    const data = await response.json();

    console.log("Login response:", data);

    if (!response.ok) {

        document.getElementById("result").innerText =
            data.detail;

        return;
    }

    // Save JWT token
    localStorage.setItem(
        "access_token",
        data.access_token
    );

    document.getElementById("result").innerText =
        "Login successful!";

    console.log("Token saved");
}


// =====================================
// ABOUT
// =====================================

async function getAbout() {

    console.log("About button clicked");

    const response = await fetch("/tasks/about");

    console.log("About status:", response.status);

    const data = await response.json();

    console.log("About data:", data);

    document.getElementById("result").innerText =
        data.company;
}


// =====================================
// GET TASKS
// =====================================

async function getTasks() {

    console.log("Task button clicked");

    // Get JWT token
    const token = localStorage.getItem("access_token");

    console.log("Token:", token);

    // Check whether user is logged in
    if (!token) {

        document.getElementById("result").innerText =
            "Please login first.";

        return;
    }

    const response = await fetch("/tasks/tasks", {

        method: "GET",

        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    console.log("Task status:", response.status);

    const data = await response.json();

    console.log("Tasks:", data);

    if (!response.ok) {

        document.getElementById("result").innerText =
            data.detail;

        return;
    }

    document.getElementById("result").innerText =
        JSON.stringify(data, null, 2);
}


// =====================================
// CONNECT BUTTONS
// =====================================

const loginButton =
    document.getElementById("loginBtn");

const aboutButton =
    document.getElementById("aboutBtn");

const taskButton =
    document.getElementById("taskBtn");


loginButton.addEventListener(
    "click",
    loginUser
);

aboutButton.addEventListener(
    "click",
    getAbout
);

taskButton.addEventListener(
    "click",
    getTasks
);


console.log("script.js loaded");