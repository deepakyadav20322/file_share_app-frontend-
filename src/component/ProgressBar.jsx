import {useState} from 'react'

const ProgressBar = ({progress}) => {
  
  return (
    <div>
        <div class="container">
         <div class="circular-progress"   style={{background: `conic-gradient(#5af44c  ${progress * 3.6}deg, #ededed 0deg)`,
        }}>
                <span class="progress-value ">{progress.toFixed(1)}<span className='text-[19px]'>%</span></span>
            </div>
           
        </div>

    </div>
  )
}

export default ProgressBar