const STORAGE_KEY = "student-management-students";

const studentForm = document.getElementById("studentForm");
const studentTableBody = document.getElementById("studentTableBody");
const studentCount = document.getElementById("studentCount");
const searchInput = document.getElementById("searchInput");
const messageBox = document.getElementById("message");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let students = loadStudents();
let currentEditId = null;

// Load stored student data from localStorage.
function loadStudents() {
  const storedStudents = localStorage.getItem(STORAGE_KEY);

  if (!storedStudents) {
    return [];
  }

  try {
    const parsedStudents = JSON.parse(storedStudents);
    return Array.isArray(parsedStudents) ? parsedStudents : [];
  } catch (error) {
    console.error("Error loading students from localStorage:", error);
    return [];
  }
}

// Save the current students array to localStorage.
function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

// Show success or error message to the user.
function showMessage(message, type = "success") {
  messageBox.textContent = message;
  messageBox.className = `message ${type}`;
}

// Reset all validation text under the form.
function clearErrors() {
  document.querySelectorAll(".error-message").forEach((element) => {
    element.textContent = "";
  });
}

// Display validation message for a specific field.
function showFieldError(fieldName, message) {
  const errorElement = document.querySelector(`[data-error-for="${fieldName}"]`);

  if (errorElement) {
    errorElement.textContent = message;
  }
}

// Read user inputs from the form.
function getStudentFromForm() {
  return {
    name: document.getElementById("name").value.trim(),
    studentId: document.getElementById("studentId").value.trim(),
    age: document.getElementById("age").value.trim(),
    department: document.getElementById("department").value.trim(),
    email: document.getElementById("email").value.trim(),
  };
}

// Validate the form inputs before saving.
function validateStudent(student) {
  const errors = {};

  if (!student.name) {
    errors.name = "Name is required.";
  } else if (student.name.length < 2) {
    errors.name = "Name must be at least 2 characters long.";
  } else if (!/^[A-Za-z\s'-]+$/.test(student.name)) {
    errors.name = "Name can only contain letters, spaces, apostrophes, and hyphens.";
  }

  if (!student.studentId) {
    errors.studentId = "Student ID is required.";
  } else if (!/^[A-Za-z0-9-]+$/.test(student.studentId)) {
    errors.studentId = "Student ID can only contain letters, numbers, and hyphens.";
  } else {
    const duplicateStudent = students.find(
      (item) =>
        item.studentId.toLowerCase() === student.studentId.toLowerCase() &&
        item.id !== currentEditId
    );

    if (duplicateStudent) {
      errors.studentId = "This Student ID already exists.";
    }
  }

  if (!student.age) {
    errors.age = "Age is required.";
  } else {
    const ageNumber = Number(student.age);

    if (!Number.isInteger(ageNumber) || ageNumber < 1 || ageNumber > 120) {
      errors.age = "Age must be a valid number between 1 and 120.";
    }
  }

  if (!student.department) {
    errors.department = "Department is required.";
  } else if (student.department.length < 2) {
    errors.department = "Department name is too short.";
  }

  if (!student.email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    errors.email = "Please enter a valid email address.";
  }

  return errors;
}

// Reset the form after add/update.
function resetForm() {
  studentForm.reset();
  clearErrors();
  currentEditId = null;
  formTitle.textContent = "Add Student";
  submitBtn.textContent = "Add Student";
  cancelEditBtn.classList.add("hidden");
}

// Fill the form with student data when editing.
function populateFormForEdit(student) {
  document.getElementById("name").value = student.name;
  document.getElementById("studentId").value = student.studentId;
  document.getElementById("age").value = student.age;
  document.getElementById("department").value = student.department;
  document.getElementById("email").value = student.email;

  currentEditId = student.id;
  formTitle.textContent = "Edit Student";
  submitBtn.textContent = "Update Student";
  cancelEditBtn.classList.remove("hidden");

  studentForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Render the visible students in the table.
function renderStudents() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filteredStudents = students.filter((student) => {
    const valuesToSearch = [
      student.name,
      student.studentId,
      student.department,
    ]
      .join(" ")
      .toLowerCase();

    return valuesToSearch.includes(searchTerm);
  });

  studentCount.textContent = students.length;

  if (filteredStudents.length === 0) {
    studentTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">No students match your search.</td>
      </tr>
    `;
    return;
  }

  studentTableBody.innerHTML = filteredStudents
    .map(
      (student) => `
        <tr>
          <td>${student.name}</td>
          <td>${student.studentId}</td>
          <td>${student.age}</td>
          <td>${student.department}</td>
          <td>${student.email}</td>
          <td>
            <div class="actions">
              <button type="button" class="table-btn edit-btn" data-id="${student.id}">Edit</button>
              <button type="button" class="table-btn delete-btn" data-id="${student.id}">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

// Handle form submission to add or update a student.
studentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const student = getStudentFromForm();
  const errors = validateStudent(student);

  clearErrors();

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([fieldName, errorMessage]) => {
      showFieldError(fieldName, errorMessage);
    });

    showMessage("Please correct the highlighted fields.", "error");
    return;
  }

  if (currentEditId) {
    students = students.map((item) =>
      item.id === currentEditId ? { ...item, ...student } : item
    );

    showMessage("Student updated successfully!", "success");
  } else {
    const newStudent = {
      id: `student-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      ...student,
    };

    students.push(newStudent);
    showMessage("Student added successfully!", "success");
  }

  saveStudents();
  renderStudents();
  resetForm();
});

// Handle table button actions for edit and delete.
studentTableBody.addEventListener("click", (event) => {
  const targetButton = event.target.closest("button");

  if (!targetButton) {
    return;
  }

  const studentId = targetButton.dataset.id;
  const selectedStudent = students.find((student) => student.id === studentId);

  if (!selectedStudent) {
    return;
  }

  if (targetButton.classList.contains("edit-btn")) {
    populateFormForEdit(selectedStudent);
    return;
  }

  if (targetButton.classList.contains("delete-btn")) {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedStudent.name}?`
    );

    if (!confirmDelete) {
      return;
    }

    students = students.filter((student) => student.id !== studentId);
    saveStudents();
    renderStudents();

    if (currentEditId === studentId) {
      resetForm();
    }

    showMessage("Student deleted successfully!", "success");
  }
});

// Filter the student list while typing in the search box.
searchInput.addEventListener("input", renderStudents);

// Cancel the current edit mode.
cancelEditBtn.addEventListener("click", () => {
  resetForm();
  showMessage("Edit cancelled.", "success");
});

// Initial render when the page loads.
renderStudents();
