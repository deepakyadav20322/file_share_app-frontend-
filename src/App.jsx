import { useState, useRef, useEffect } from "react";
import { Dialog, Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import fileImg from "./assets/fileImg.svg";
import Email from "./component/Email";
import copyIcon from "./assets/copy-icon.svg";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import ProgressBar from "./component/ProgressBar";
import {RiLoader4Line} from 'react-icons/ri'
import baseURL from "./config";

function App() {
  // const baseURL = "http://127.0.0.1:3000/api";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fileData, setFileData] = useState(null);
  const [linkBtnShow, setLinkBtnShow] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [linkBox, setLinkBox] = useState(false);
  const [progress, setProgress] = useState(100);
  const [fileImgShow, setFileImgShow] = useState(true);
  const [UUID, setUUID] = useState("");
  const [btnSpin,setBtnSpin] = useState(false);
  const [uploadmessage, setuploadMessage] = useState("Click here to Upload your file");
  const inputRef = useRef(null);

  const copyToClipboard = () => {
    if (inputRef.current) {
      inputRef.current.select();
      document.execCommand("copy");
    }
  };

  const navigation = [
    { name: "Features", href: "#" },
    { name: "About", href: "#" },
    { name: "Documentation", href: "#" },
    // { name: 'Company', href: '#' },
  ];


  const handleFile = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      if (uploadedFile.size >= 100 * 1024 * 1024) {
        console.log("File size = ", uploadedFile.size / (1024 * 1024));
        toast.success("File size exceeds 100MB limit");
      }
      const formData = new FormData();
      formData.append("myfile", uploadedFile);
      setFileData(formData);
      setLinkBtnShow(true);
      setLinkBox(false);
      setuploadMessage("File uploaded successfully");
      console.log(formData);
      console.log(fileData?.get("myfile"));

      console.log("uploadfile:-", uploadedFile);
    } else {
      toast.success("Something went wrong");
      console.log("file not uploaded on browase...");
    }
  };

  const handleUploadFile = async () => {
    if (!fileData) {
      return toast.success("Please ,first upload file", {
        duration: 6000,
        style: {
          padding: "10px 50px",
        },
      });
    }
    setBtnSpin(true)
    console.log("async:--", fileData.get("myfile"));
    try {
      const res = await axios.post(`${baseURL}/files`, fileData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          // console.log(`Upload Progress: ${progress.toFixed(2)}%`);
          setProgress(progress);
         
          setFileImgShow(false);
        },
      });

      if (res.status === 200) {
        setFileImgShow(true);
        setLinkBtnShow(false);
        setShareLink(res.data.file);
        setLinkBox(true);
        setBtnSpin(false);
        const parts = (res.data.file).split('/');
        const uuid = parts[parts.length - 1];
        console.log(uuid)
        setUUID(uuid)
        console.log(res.data);
        console.log(res.status);
      }
    } catch (error) {
      console.log("error:-", error);
    }
  };

  return (
    <>
      <div className="bg-white">
        
        <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-t from-[#D9FBE5] to-white ">
          <nav
            className="flex items-center justify-between p-2 md:px-8"
            aria-label="Global"
          >
            <div className="flex md:flex-1">
              <a href="#" className="-m-1.5 p-1.5">
                <span className="sr-only">Your Company</span>
                {/* <img
                className="h-8 w-auto"
                src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                alt=""
              /> */}
                <h1 className="text-[26px] mb-1  font-[700] text-[#37D154]">
                  DocWave
                </h1>
              </a>
            </div>
            <div className="flex md:hidden">
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="hidden md:flex md:gap-x-12">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-semibold cool-link leading-6 text-gray-900"
                >
                  {item.name}
                </a>
              ))}
            </div>
            <div className="hidden md:flex md:flex-1 md:justify-end md:gap-4 mb-1">
              <a
                href="#"
                className="text-white rounded-[20px] text-[18px] font-[600] px-5 py-[8px] bg-[#37d154]  text-sm  leading-6  hover:bg-[#edf0f2] hover:text-[#000] transition-all duration-300  "
              >
                Log in<span aria-hidden="true">&rarr;</span>
              </a>
              <a
                href="#"
                className="text-white text-[18px] rounded-[20px] font-[600] px-5 py-[8px] bg-[#37d154] text-sm  leading-6 hover:bg-[#edf0f2] hover:text-[#000] transition-all duration-300"
              >
                Sign in<span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </nav>
          <Dialog
            as="div"
            className="md:hidden"
            open={mobileMenuOpen}
            onClose={setMobileMenuOpen}
          >
            <div className="fixed inset-0 z-50" />
            <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
              <div className="flex items-center justify-between">
                <a href="#" className="-m-1.5 p-1.5">
                  <span className="sr-only">Your Company</span>
                  <h1 className="text-[20px] mb-1 font-[700] text-[rgb(31,237,96)]">
                    DocWave
                  </h1>
                  {/* <img
                  className="h-8 w-auto"
                  src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                  alt=""
                /> */}
                </a>
                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10">
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                  <div className="">
                    <a
                      href="#"
                      className="-mx-3 block rounded-lg px-3 py-2.5  bg-[#37d154]  text-base font-semibold leading-7 text-gray-900 mb-2  hover:bg-[#edf0f2] hover:text-[#37d154] transition-all"
                    >
                      Sign in
                    </a>
                    <a
                      href="#"
                      className="-mx-3 block rounded-lg px-3 py-2.5  bg-[#37d154]  text-base font-semibold leading-7 text-gray-900  hover:bg-[#edf0f2] hover:text-[#37d154] transition-all"
                    >
                      Log in
                    </a>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Dialog>
        </header>

        <div className="relative isolate px-6 pt-14 mt-[50px] max-w-[1280px] m-auto md:px-8 flex flex-col justify-around align-top lg:flex-row lg:justify-around">
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#55f38a] to-[#9189fcd3] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>
          <div className="home-left max-w-[380px] mt-10 lg:mr-10 m-auto">
             <h1 className="text-[35px] font-[600]"> Send your document with others,FREE</h1>
             <h3 className="mb-10 lg:mb-0"> Share any file or video easily, with anyone</h3>
             {/* <h3>Your file transfer is secure and fast.</h3> */}
             <div className="w-[350px] h-[350px] hidden lg:flex  justify-center">
             <img className=" object-cover w-[300px] h-[300px] " src="https://fjord.dropboxstatic.com/warp/conversion/dropbox/warp/en-us/features/share/share_Hero_00@2x.png?id=056bc1c0-434a-4256-806e-c59e0496eba5&output_type=webp" alt="" />
             </div>
          </div>

          <div className="webshare-box flex flex-col justify-start items-center min-h-[100%] h-[100%] max-w-[1280px] m-auto lg:pb-[80px]">
            <div className="shadow-[0_3px_10px_rgb(0,0,0,0.2)] flex flex-col justify-start items-center pt-4 pb-2 rounded">
              <div className="webshare-box-file border-2 border-black w-[450px] p-4 rounded mx-2 flex flex-col justify-center items-center ">
                <div className="border-[2px] border-dashed border-[#5af44c] rounded">
                <label className="webshare-box-file-top cursor-pointer w-[380px] bg-[#d1fccd] hover:bg-[#b8f7b3] transition-all border-2 border-solid border-[#5af44c] rounded flex flex-col justify-center items-center m-1 pt-6 pb-3">
                  <img
                    className={`w-[80px] h-[80px] my-3 ${fileImgShow? 'block':'hidden'}`}
                    src={fileImg}
                    alt="file-Logo"
                  />
                  <div className={`${fileImgShow?'hidden':'block'}`}>
                  <ProgressBar progress={progress} />
                  </div>
                  <p>{uploadmessage}</p>
                   {uploadmessage==="File uploaded successfully"?
                    <div className="text-[12px] flex flex-col justify-center items-center">
                    <p>or</p>
                    <p>click for browase another file</p></div>
                    :""
                  }
                  <input
                    type="file"
                    name="myfile"
                    id="dropZone"
                    className="hidden "
                    onChange={handleFile}
                  />
                </label>
                </div>
                <div className="flex flex-col-reverse">
                  <button
                    className={`share-link mt-[10px] bg-[#6EED1F] transition-all hover:bg-[#b8f7b3] border-2 border-[#6EED1F] border-dashed py-[6px] px-[40px] rounded-[30px] ${
                      linkBtnShow ? "block" : "hidden"}`}
                    onClick={handleUploadFile}
                  >
                    <span className="flex flex-row ">
                      Generate share link {btnSpin?<RiLoader4Line size={22} color="" className=" ml-1 mt-1 animate-spin "/>:"" }
                      </span> 
                  </button>
                  <p className={`${fileData ? "block" : "hidden"} overflow-hidden`}>
                    file name :-{fileData?.get("myfile")?.name}{" "}
                  </p>
                </div>
                <div className="webshare-box-file-bottom "></div>
              </div>
              <div
                className={`sharing-container my-2 ${
                  linkBox ? "block" : "hidden"
                }`}
              >
                <p className="text-center mt-2 mb-2">link expirs in 24 hours</p>
                <div className="input-container">
                  <input
                    type="text"
                    className="fileURL"
                    value={shareLink}
                    ref={inputRef}
                    readOnly
                  />
                  <div className="copy-icon-box h-full bg-[#fff] w-[15px]">
                    <img
                      src={copyIcon}
                      alt="copy-icon"
                      id="copyBtn "
                      onClick={copyToClipboard}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p>or</p>
                  <p>Send by email</p>
                </div>
              </div>
              <div className={`${linkBox ? "block" : "hidden"}`}>
                <Email UUID={UUID} />
              </div>
            </div>
          </div>

          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#55f38a] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}

export default App;
