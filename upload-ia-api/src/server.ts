import {fastify} from 'fastify'
import {fastifyCors} from '@fastify/cors'
import {prisma} from './lib/prisma'
import { getAllPromptsRoute } from './routes/get-all-prompts';
import { uploadVideoRoute } from './routes/upload-video';
import { createTranscriptionRoute } from './routes/create-transcription';
import { generateAiCompletionRoute } from './routes/generate-ia-completion';
const app = fastify();

app.register(fastifyCors, {
    origin: "*"
})

app.register(getAllPromptsRoute) //Todas  as funções precisam ser assíncronas
app.register(uploadVideoRoute)
app.register(createTranscriptionRoute)
app.register(generateAiCompletionRoute)

app.listen({
    port: 3333,
}).then(() => {
    console.log('HTTP Server Running!')
})