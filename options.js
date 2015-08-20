!function() {
    document.getElementById("config-go").addEventListener("click", function() {
        localStorage.setItem("aws-config", JSON.stringify({
            akid: document.getElementById("akid").value,
            sak: document.getElementById("sak").value
        }));
    });
}();
