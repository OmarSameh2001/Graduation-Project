import React, { useState } from "react";
import "./App.css";
import axios from "axios";
import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import "bootstrap/dist/css/bootstrap.min.css";
import imageCompression from "browser-image-compression";

function App() {
  const [images, setImages] = useState(null);
  const [apiResponse, setApiResponse] = useState(null); // State to store API response
  const [errorRes, setErrorRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState(null);
  const [link, setLink] = useState(null);
  const [compsize, setCompsize] = useState(null);
  const apikey = process.env.REACT_APP_API_KEY;

  async function handleImageCompress(img) {
    const imageFile = img;
    const options = {
      maxSizeMB: 2.9,
      useWebWorker: true,
    };
    setLoading(true);
    try {
      const compressedFile = await imageCompression(imageFile, options);
      setLoading(false);
      const downloadLink = URL.createObjectURL(compressedFile);
      setLink(downloadLink);
      setErrorRes(null);

      // Read the compressedFile as base64 directly
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64StringCompress = reader.result.split(",")[1];
        setImages(base64StringCompress);
      };
      reader.readAsDataURL(compressedFile);
      setCompsize(compressedFile.size / 1024 / 1024);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  async function api(image) {
    try {
      setLoading(true);
      const response = await axios({
        method: "POST",
        url: "https://classify.roboflow.com/tires-defects/1",
        params: {
          api_key: apikey,
        },
        data: image,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      console.log(response.data);
      setLoading(false);
      setApiResponse(response.data); // Set API response to state
      setCompsize(null);
    } catch (error) {
      console.log(error.message);
      setErrorRes(error.message);
      setLoading(false);
    }
  }
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    setRaw(file);
    reader.onloadend = () => {
      const base64String = reader.result
        .replace("data:", "")
        .replace(/^.+,/, "");
      setImages(base64String);
      //console.log(images);
    };

    reader.readAsDataURL(file);
  };

  function hand() {
    api(images);
    //apiup(images);
  }
  function resetStates() {
    setApiResponse(null);
    setImages(null);
    setErrorRes(null);
    setRaw(null);
    setCompsize(null);
  }
  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        className="App-header"
      >
        {!images && (
          <>
            <h1 className="pt-5">Kindly choose an image to upload</h1>
            <p className="py-2 text-primary">
              Note: For best results clean the tire
            </p>
            <input
              style={{ cursor: "pointer" }}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
            />
          </>
        )}
        {images && !apiResponse && !errorRes && (
          <>
            <h1 className="pt-2">Press Upload to process your image</h1>
            <p className="text-primary">
              Note: For best results clean the tire
            </p>
          </>
        )}
        {images && apiResponse && (
          <h1 className="py-2">Press reset to test new image</h1>
        )}
        {images && errorRes && (
          <h1 className="py-2">
            Error occured try uploading again or press reset
          </h1>
        )}

        {images && (
          <div
            style={{
              marginTop: "20px",
              maxWidth: "500px",
              height: "400px",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            className="px-2"
          >
            <img
              src={link ? link : `data:image/jpeg;base64,${images}`}
              alt="Uploaded"
              style={{
                maxWidth: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          </div>
        )}
        {apiResponse ? (
          <div
            style={{ marginTop: "20px", marginInline: "auto" }}
            className="row"
          >
            <p className="col-auto">
              Your Tire is:{" "}
              <span
                style={{
                  color:
                    apiResponse.top === "Good"
                      ? "green"
                      : apiResponse.top === "Defected"
                      ? "red"
                      : "black",
                  fontWeight: "bold",
                }}
              >
                {apiResponse.top}
              </span>
              , with confidence{" "}
              {(parseFloat(apiResponse.confidence) * 100).toFixed(2)}%
            </p>

            {apiResponse.top === "Defected" && (
              <a
                href="https://www.fitandfix.com"
                className="col-auto text-white"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "20px",
                  background: "#032c81",
                }}
              >
                Redirect to specialist
              </a>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button
              style={{ margin: "20px", minWidth: "100%" }}
              className="btn bg-success text-white upload-button"
              disabled={!images || loading || errorRes}
              onClick={() => {
                hand();
                setErrorRes(null);
              }}
            >
              {loading ? "Loading..." : "Upload"}
            </button>
            {loading && (
              <div
                className="my-2 spinner-border"
                role="status"
                style={{ alignSelf: "center" }}
              />
            )}
          </div>
        )}
        {errorRes === "Request failed with status code 413" ? (
          <>
            <p className="bg-danger">
              The image is too large, compress to upload
            </p>
            <button
              className="btn btn-primary"
              style={{ minWidth: "10%" }}
              onClick={() => handleImageCompress(raw)}
              disabled={loading}
            >
              Compress{loading ? "ing..." : ""}
            </button>
          </>
        ) : errorRes ? (
          <>
            <p className="bg-danger">
              An error occurred, try compressing the image
            </p>
            <button
              className="btn btn-primary"
              style={{ minWidth: "10%" }}
              onClick={() => handleImageCompress(raw)}
              disabled={loading}
            >
              Compress{loading ? "ing..." : ""}
            </button>
          </>
        ) : null}
        {compsize && (
          <p className="bg-primary">
            Your image has been compressed to size: {compsize.toFixed(1)} MB
          </p>
        )}
        {images && (
          <>
            <button
              style={{ margin: "15px", minWidth: "10%" }}
              className="btn bg-danger text-white col-md-1"
              onClick={resetStates}
              disabled={loading}
            >
              Reset
            </button>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

export default App;
