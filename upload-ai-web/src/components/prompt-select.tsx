import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { api } from "@/lib/axios"


interface Prompt {
    id: string,
    title: string,
    template: string,
}

interface PromptSelectProps {
    onPromptSelected: (template: string) => void
}


export function PromptSelect(props : PromptSelectProps) {
    const [prompts, setPrompts] = useState<Prompt[] | null>(null)


    useEffect(() => {
        api.get('/prompts').then((res) => {
            setPrompts(res.data)
        })
    }, [])

    const handlerPromptSelected = (promptId: string) => {
        const selectedPrompt = prompts?.find(prompt => prompt.id === promptId)

        if(!selectedPrompt) return

        props.onPromptSelected(selectedPrompt.template)
    }

    return (
        <Select onValueChange={handlerPromptSelected}>
            <SelectTrigger>
                <SelectValue placeholder='Seleciona um prompt'/>
            </SelectTrigger>
            <SelectContent>
                {
                    prompts?.map((prompt: Prompt) => {
                            return (
                                <SelectItem key={prompt.id} value={prompt.id}>
                                    {prompt.title}
                                </SelectItem>
                            )
                    })
                }
            </SelectContent>
        </Select>
    )
}