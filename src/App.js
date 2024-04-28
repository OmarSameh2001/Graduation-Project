import React, { useState } from "react";
import "./App.css";
import axios from "axios"; // Import axios for api calling
import Navbar from "./Components/Navbar/Navbar"; // Import Navbar component
import Footer from "./Components/Footer/Footer"; // Import Footer component
import "bootstrap/dist/css/bootstrap.min.css"; // Import bootstrap
import imageCompression from "browser-image-compression"; // import image compression to avoid API limits

function App() {
  // UseStates for handling project state management
  const [images, setImages] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [errorRes, setErrorRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [large, setLarge] = useState(false);
  const [raw, setRaw] = useState(null);
  const [link, setLink] = useState(null);
  const [compsize, setCompsize] = useState(null);
  const apikey = process.env.REACT_APP_API_KEY; // hidding the api key for security reasons

  async function handleImageCompress(img) {
    const imageFile = img;
    const options = {
      maxSizeMB: 2.9, // max size in MB
      useWebWorker: true,
    };
    setLoading(true);
    try {
      const compressedFile = await imageCompression(imageFile, options); // compress image
      setLoading(false);
      const downloadLink = URL.createObjectURL(compressedFile);
      setLink(downloadLink);
      setErrorRes(null);
      setLarge(false);

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
    // API call to classify image
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
    // Handle file input and convert to base64
    const file = event.target.files[0];
    const reader = new FileReader();
    setRaw(file);
    if (file.size >= 3 * 1024 * 1024) {
      // Check if file size is 3 MB or smaller
      setLarge(true);
    }
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
    // send image to api
  }
  function resetStates() {
    setApiResponse(null);
    setImages(null);
    setErrorRes(null);
    setRaw(null);
    setCompsize(null);
    setLink(null);
    setLarge(false);
  }
  return (
    <>
      <Navbar /> {/* Navbar component */}
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

        {/* Now we will handle the Header */}
        {/* If there is no image yet*/}
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

        {/* If There is an image but not uploaded to api*/}
        {images && !apiResponse && !errorRes && (
          <>
            <h1 className="pt-2">Press Upload to process your image</h1>
            <p className="text-primary">
              Note: For best results clean the tire
            </p>
          </>
        )}

        {/* Image uploaded and api response received */}
        {images && apiResponse && (
          <h1 className="py-2">Press reset to test new image</h1>
        )}

        {/* Image uploaded and error occured */}
        {images && errorRes && (
          <h1 className="py-2">
            Error occured try uploading again or press reset
          </h1>
        )}

        {/* If there is an image render it */}
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

        {/* If there is an api response render it */}
        {apiResponse ? (
          <div
            style={{ marginTop: "20px", marginInline: "auto" }}
            className="row"
          >
            <p className="col-auto">
              Your Tire is:{" "}
              {/* Change color based on prediction */}
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

            {/* Redirect to specialist if prediction is defected */}
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
              disabled={!images || loading || errorRes || large} 
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

        
        {/* Handling error types and compressing if needed */}
        {errorRes === "Request failed with status code 413" || large ? (
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
        {/* Give feedback */}
        {apiResponse && (
              <a
                href="https://forms.gle/pnFm3no8Eu8NL15YA"
                className="col-auto text-white"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "20px",
                  background: "#032c81",
                  paddingBottom: "5px",
                }}
              >
                Write Feedback
              </a>
            )}
      </div>
      <Footer /> {/* Footer component */}
    </>
  );
}

export default App;
