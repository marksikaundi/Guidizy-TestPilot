const datasets = [
      {
        name: "Iris Dataset",
        description: "Classic dataset for classification, contains flower measurements.",
        url: "https://archive.ics.uci.edu/ml/datasets/iris"
      },
      {
        name: "Titanic Dataset",
        description: "Passenger data for predicting survival (Kaggle classic).",
        url: "https://www.kaggle.com/c/titanic"
      },
      {
        name: "MNIST Digits",
        description: "Handwritten digits for image classification tasks.",
        url: "http://yann.lecun.com/exdb/mnist/"
      },
      {
        name: "CIFAR-10",
        description: "Labeled 32x32 images across 10 classes, useful for deep learning.",
        url: "https://www.cs.toronto.edu/~kriz/cifar.html"
      },
      {
        name: "COCO Dataset",
        description: "Large-scale object detection, segmentation, and captioning dataset.",
        url: "https://cocodataset.org/"
      },
      {
        name: "Amazon Product Reviews",
        description: "Text dataset of customer reviews and ratings.",
        url: "https://registry.opendata.aws/amazon-reviews/"
      },
      {
        name: "NYC Taxi Trips",
        description: "Detailed public data on taxi rides in New York City.",
        url: "https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page"
      }
    ];

    const datasetList = document.getElementById("dataset-list");
    const searchInput = document.getElementById("search");

    function renderDatasets(filter = "") {
      datasetList.innerHTML = "";

      const filtered = datasets.filter(d =>
        d.name.toLowerCase().includes(filter.toLowerCase()) ||
        d.description.toLowerCase().includes(filter.toLowerCase())
      );

      filtered.forEach(dataset => {
        const div = document.createElement("div");
        div.className = "dataset";
        div.innerHTML = `
          <h3>${dataset.name}</h3>
          <p>${dataset.description}</p>
          <a href="${dataset.url}" target="_blank">View Dataset</a>
        `;
        datasetList.appendChild(div);
      });

      if (filtered.length === 0) {
        datasetList.innerHTML = "<p>No datasets found.</p>";
      }
    }

    searchInput.addEventListener("input", e => {
      renderDatasets(e.target.value);
    });

    renderDatasets();