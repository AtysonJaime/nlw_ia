import { FileVideo, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { ChangeEvent, useState, useMemo, FormEvent, useRef } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { api } from "@/lib/axios";

type Status =  'waiting' | 'converting' | 'generating' | 'uploading' |'success'

const statusMensagens = {
    converting: 'Convertendo...',
    generating: 'Transcrevendo...',
    uploading: 'Enviando...',
    success: 'Sucesso!'
}

interface VideoInputFormProps {
    onVideoUploaded: (videoId: string) => void
}

export function VideoInputForm(props: VideoInputFormProps) {
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [status, setStatus] = useState<Status>('waiting')
    const promptInputRef = useRef<HTMLTextAreaElement>(null)

    const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
        const { files } = event.currentTarget
        if(!files) return

        const selectedFile = files[0]

        setVideoFile(selectedFile)

    }

    const convertVideoToAudio = async (video: File) => {
        console.log("Convert started")

        const ffmpeg = await getFFmpeg()

        await ffmpeg.writeFile('input.mp4', await fetchFile(video))

        // ffmpeg.on('log', log => {
        //     console.log(log)
        // })

        ffmpeg.on('progress', progress => {
            console.log('Convert progress: ', + Math.round(progress.progress * 100))
        })

        await ffmpeg.exec([
            '-i',
            'input.mp4',
            '-map',
            '0:a',
            '-b:a',
            '20k',
            '-acodec',
            'libmp3lame',
            'output.mp3'
        ])

        const data = await ffmpeg.readFile('output.mp3')

        const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
        const audioFile = new File([audioFileBlob], 'audio.mp3', { type: 'audio/mpeg' })

        console.log('Convert finished')

        return audioFile
    }

    const handleUploadVideo = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const prompt = promptInputRef.current?.value;

        if(!videoFile) return

        setStatus('converting')

        // converter o video em áudio

        const audioFile = await convertVideoToAudio(videoFile)

        console.log(audioFile)

        const data = new FormData()

        data.append('file', audioFile)

        setStatus('uploading')

        const response = await api.post('/videos', data)

        const videoId = response.data.video.id

        setStatus('generating')

        await api.post(`/videos/${videoId}/transcriptions`, {
            prompt,
        })

        setStatus('success')

        props.onVideoUploaded(videoId)
    }

    const previewUrl = useMemo(() => {
        if(!videoFile) return null

        return URL.createObjectURL(videoFile) //Cria uma pre visualização de um arquivo
    }, [videoFile])

    return (
        <form className='space-y-6' onSubmit={handleUploadVideo}>
            <label 
                className='relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5'
                htmlFor='video'
            >
                {
                    previewUrl ? (
                        <video src={previewUrl} controls={false} className="pointer-events-none absolute inset-0"/>
                    ) : (
                        <>
                            <FileVideo className='w-4 h-4'/>
                            Selecione um vídeo
                        </>
                    )
                }
            </label>
            <input type='file' id='video' accept='video/mp4' className='sr-only' onChange={handleFileSelected}/>

            <Separator/>

            <div className='space-y-2'>
                <Label htmlFor='transcription_prompt'>Prompt de transcrição</Label>
                <Textarea disabled={status !== 'waiting'} ref={promptInputRef} id='transcription_prompt' className='h-20 resize-none leading-relaxed' placeholder='Inclua palavras-chaves mencionadas no vídeo separadas por vírgulas'/>
            </div>

            <Button
                data-success={status === 'success'} 
                type='submit'
                className='w-full data-[success=true]:bg-emerald-400' 
                disabled={status !== 'waiting'}
            >
                {status  === 'waiting' ? (
                    <>
                        Carregar vídeo
                        <Upload className='w-4 h-4 ml-2'/>
                    </>
                ) : statusMensagens[status]}
            </Button>
        </form>
    )
}