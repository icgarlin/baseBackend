


class FileHelper {

    checkImageAudioVideo = (ext: string): string => {
        switch(true) {
            /* Image */ 
            case ext === '.png':
                return 'image';
            case ext === '.jpg':
                return 'image';
            case ext === '.jpeg':
                return 'image';
            /* Audio */ 
            case ext === '.mp3':
                return 'audio';
            case ext === '.m4a':
                return 'audio';
            case ext === '.wav':
                return 'audio';
            /* Video */ 
            case ext === '.mp4':
                return 'video';
            case ext === '.MOV' || ext === '.mov': 
                return 'video'; 
            /* PDF */ 
            case ext === '.pdf': 
                return 'pdf';
            /* Zip */ 
            case ext === '.zip': 
                return 'zip';  
        }
  } 

  findExtension = (url: string): string => {
    switch (true) {
        /* Image */ 
        case url.includes('image/png'): 
            return '.png';
       case url.includes('image/jpg'): 
            return '.jpg';
        case url.includes('image/jpeg'): 
            return '.jpeg';
        /* Audio */ 
        case url.includes('audio/mpeg'): 
            return '.mp3'; 
        case url.includes('audio/x-m4a'): 
            return '.m4a'; 
        case url.includes('audio/wav'): 
            return '.wav';
        /* Video */ 
        case url.includes('video/mp4'):
            return '.mp4';
        case url.includes('video/quicktime'): 
            return '.mov'; 
        /* PDF */ 
        case url.includes('application/pdf'): 
            return '.pdf'; 
        /* Zip */ 
        case url.includes('application/zip'): 
            return '.zip'; 
    }
    return ''; 
  }

}


export default FileHelper; 