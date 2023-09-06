import {useState} from 'react'
import { toast,Toaster } from 'react-hot-toast';
import axios from 'axios'
import baseURL from '../config';

const Email = ({UUID}) => {
    
    // const baseURL = "http://127.0.0.1:3000/api";
    const [senderEmail,setSenderEmail] = useState("")
    const [recieverEmail,setReceiverEmail] = useState('')
    const [emailData,setEmailData] = useState({})
    const [loader,setLoader] = useState(false)
    const [uniqueID ,setuniqueID] = useState(UUID)

     const handleEmailChange = (e)=>{
      const {name,value} = e.target ;
      setEmailData((prevFormData) => ({ ...prevFormData, [name]: value,uuid:UUID }));
      
     }
     const sendEmailData = async()=>{
        try {
      setLoader(true);
      console.log(emailData);
            const res = await axios.post(`${baseURL}/files/send`,emailData,{
                headers:{
                    'Content-Type':'application/json',
                }
            });
            if(res.status===200){
              setEmailData({
                emailTo: '', 
                emailFrom: '', 
              
            });
                console.log(res);
                toast.success(res.data.message);
                setLoader(false);
            }
            
        } catch (error) {
          setLoader(false)
            console.log(error);
            toast.error('Somthing went wrong, while sending email, Try again')
        }
     }

  return (
    <div className='webshare-box-email border-2 border-black w-[450px] px-4 my-3 mx-2 h-[175px] lg:h-[150px] flex flex-row-reverse justify-center items-center'>

      <div className={`w-[100px] h-[100px] object-cover ml-2 flex flex-col justify-center items-center ${loader?'hidden':'block'}`}>
        <p className='text-[14px] font-[500]'>Or scan QR</p>
        <img className='w-[100px] ml-2' src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://file-share-app-backend.onrender.com/files/${UUID}`} alt="qrImg" />
        </div>

         <div className={`flex flex-col justify-center items-center  ${loader?'hidden':'block'}`}>
        <div className='mb-1 mt-[1rem]'>
                  <label htmlFor="sender" className='pt-1'>Sender email</label>
                  <input type="email" id='sender' name='emailFrom' value={emailData.emailFrom} className='border-b-2 border-black mr-4 ml-3 outline-none ' onChange={handleEmailChange} required/>
                </div>
                <div className='mb-0 lg:mt-[1.5rem]'>
                  <label htmlFor="reciver" className='pt-1'>Reciver email</label>
                <input type="email" id='reciver' name='emailTo' value={emailData.emailTo} className='border-b-2 border-black ml-3 mr-4 outline-none' onChange={handleEmailChange} required/>
                </div>
                <button className=' border-[1px] outline-none bg-[#6EED1F] rounded px-3 py-2 mt-2 ml-20 mb-2 ' onClick={sendEmailData}>Send Email</button>
        </div>
        <div className={`${loader?'block':'hidden'} z-50 flex justify-center items-center`}>
   <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-[#6EED1F]"></div>
        </div>
   
        <Toaster/>
    </div>
  )
}

export default Email