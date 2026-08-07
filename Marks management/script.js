let highestPercentage = 0;
let topper = "";

function calculate() {

    let name = document.getElementById("name").value;

    let physics = Number(document.getElementById("phy").value);
    let chemistry = Number(document.getElementById("chem").value);
    let maths = Number(document.getElementById("math").value);


    // Calculate Total and Average
    let total = physics + chemistry + maths;
    let average = total / 3;


    // Display Result
    document.getElementById("total").value = total;
    document.getElementById("percentage").value = average.toFixed(2) + "%";


    // Add data to table
    let table = document.getElementById("studentTable");

    let row = table.insertRow();

    row.insertCell(0).innerHTML = name;
    row.insertCell(1).innerHTML = total;
    row.insertCell(2).innerHTML = average.toFixed(2) + "%";


    // Find Topper
    if (average > highestPercentage) {

        highestPercentage = average;
        topper = name;

    }


    document.getElementById("topper").innerHTML = 
    "Topper : " + topper;

}