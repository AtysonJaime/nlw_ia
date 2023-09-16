import { FastifyInstance } from "fastify";
import {z} from 'zod'
import {createReadStream} from 'node:fs'
import { prisma } from "../lib/prisma"
import { openai } from "../lib/openai"


export async function generateAiCompletionRoute(app:FastifyInstance) {
    app.post('/ai/complete', async (req, reply) => {
        const bodySchema = z.object({
            videoId: z.string().uuid(),
            template: z.string(),
            temperature: z.number().min(0).max(1).default(0.5),
        })

        console.log(bodySchema.parse(req.params))
        
        const {videoId, template, temperature} = bodySchema.parse(req.params);


        const video = await prisma.video.findFirstOrThrow({
            where: {
                id: videoId
            }
        })

        if(!video.transcription) {
            return reply.status(400).send({error: "Video transcription was not generated yet"})
        }

        const promptMessage = template.replace('{transcription}', video.transcription)

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo-16k',
            temperature,
            messages: [
                {role: 'user', content: promptMessage},
            ]
        })
        return {response};
    })
}