!function() {
    var ELB_URL =
        "https://console.aws.amazon.com/ec2/v2/home?region=REGION" +
        "#LoadBalancers:search=NAME";
    var INSTANCES_URL =
        "https://console.aws.amazon.com/ec2/v2/home?region=REGION" +
        "#Instances:instanceId=INSTANCE_IDS;sort=tag:Name";
    var ASG_URL =
        "https://console.aws.amazon.com/ec2/autoscaling/home?" +
        "region=REGION#AutoScalingGroups:filter=NAME;view=details";

    function showError(message) {
        var errorsContainer = document.getElementById("errors-container");
        var errorsElement = document.getElementById("errors");

        errorsContainer.classList.remove("hidden");
        message = "" + message + "\n";
        errorsElement.textContent += message;
    }

    function showLinks(message, href) {
        message += "\n";
        var element;
        if (href) {
            element = document.createElement("a");
            element.setAttribute("href", href);
            element.textContent = message;
        } else {
            element = document.createTextNode(message);
        }
        document.getElementById("links").appendChild(element);
    }

    try {
        var awsConfig = JSON.parse(localStorage.getItem("aws-config"));
        AWS.config.update({
            accessKeyId: awsConfig.akid,
            secretAccessKey: awsConfig.sak
        });
    } catch (e) {
        showError(
            "AWS Credentials not set up. I'll refuse to work until you fix " +
            "this. You can set up these credentials in my options."
        );
        showError(e);

        return;
    }

    // Apparently, you have to manually configure anchor click behavior in
    // popups...
    document.getElementById("links").addEventListener("click", function(evt) {
        chrome.tabs.query({active: true}, function(tabs) {
            var targetIndex = null;
            try {
                targetIndex = tabs[0].index + 1;
            } catch (e) {
            }
            chrome.tabs.create({
                url: evt.target.getAttribute("href"),
                index: targetIndex
            });
        });
        return false;
    });

    chrome.tabs.executeScript(null, {file: "injected.js"}, function(results) {
        var result = results[0];

        var regionID;
        try {
            regionID = /region=([a-z0-9\-]*)/.exec(result.url)[1];
        } catch (e) {
            showError(
                "Unable to parse region from URL. Possibly unsupported " +
                "AWS panel."
            );

            return;
        }

        var environmentID;
        try {
            environmentID =
                /environmentId=(e-[a-z0-9\-]*)/.exec(result.url)[1];
        } catch (e) {
            showError(
                "Unable to parse environment ID from URL. Possibly outside " +
                "Elastic Beanstalk panel?"
            );

            return;
        }

        showLinks("Detected Region ID: " + regionID);
        showLinks("Detected Env ID: " + environmentID);

        var beanstalk = new AWS.ElasticBeanstalk({
            apiVersion: "2010-12-01",
            region: regionID
        });

        beanstalk.describeEnvironmentResources({
            EnvironmentId: environmentID
        }, function(err, data) {
            if (err) {
                showError(err);
                return;
            }
            // showError(JSON.stringify(data, null, "  "));

            showLinks("\nLoad Balancer:");
            var loadBalancers = data.EnvironmentResources.LoadBalancers;
            for (var i = 0; i < loadBalancers.length; ++i) {
                showLinks(
                    loadBalancers[i].Name,
                    ELB_URL
                        .replace("REGION", regionID)
                        .replace("NAME", loadBalancers[i].Name)
                );
            }

            showLinks("\nInstances:");
            var instances = data.EnvironmentResources.Instances;
            var instanceIDs = [];
            for (var i = 0; i < instances.length; ++i) {
                instanceIDs.push(instances[i].Id);
            }
            showLinks(
                instanceIDs.join(", "),
                INSTANCES_URL
                    .replace("REGION", regionID)
                    .replace("INSTANCE_IDS", instanceIDs.join(","))
            );

            showLinks("\nAuto Scaling Group:");
            var autoScalingGroups =
                data.EnvironmentResources.AutoScalingGroups;
            for (var i = 0; i < autoScalingGroups.length; ++i) {
                showLinks(
                    autoScalingGroups[i].Name,
                    ASG_URL
                        .replace("REGION", regionID)
                        .replace("NAME", autoScalingGroups[i].Name)
                );
            }
        });
    });
}();
