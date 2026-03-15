import mongoose from 'mongoose';
import 'dotenv/config';

async function connectDB() {
    try{
        mongoose.connect(process.env.MONGO_URI)
        console.log('MongoDB connected')
    }catch(error){
        console.log(error)
    }
}


export default connectDB;