const express=require("express");
const body_parser=require("body-parser");
const axios=require("axios");
const mysql=require("mysql");
const con=mysql.createConnection({
    host:"122.180.254.41",
    user:"info_crmtest",
    password:"Hawamahal123",
    database:"info_whatsapp"
});


require('dotenv').config();

const app=express().use(body_parser.json());

const token=process.env.TOKEN;
const mytoken=process.env.MYTOKEN;//prasath_token

app.listen(process.env.PORT,()=>{
    console.log("webhook is listening");
});

//to verify the callback url from dashboard side - cloud api side
app.get("/webhook",(req,res)=>{
   let mode=req.query["hub.mode"];
   let challange=req.query["hub.challenge"];
   let token=req.query["hub.verify_token"];


    if(mode && token){

        if(mode==="subscribe" && token===mytoken){
            res.status(200).send(challange);
        }else{
            res.status(403);
        }

    }

});

app.post("/webhook",(req,res)=>{

    let body_param=req.body;

    console.log(JSON.stringify(body_param,null,2));

    if(body_param.object){
        console.log("inside body param");
        if(body_param.entry && 
            body_param.entry[0].changes && 
            body_param.entry[0].changes[0].value.messages && 
            body_param.entry[0].changes[0].value.messages[0]  
            ){
               let phon_no_id=body_param.entry[0].changes[0].value.metadata.phone_number_id;
               let from = body_param.entry[0].changes[0].value.messages[0].from; 
               let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;
               let epochTimeStamp = body_param.entry[0].changes[0].value.metadata.timestamp;
            

  var d = new Date(epochTimeStamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = d.getFullYear();
  var month = months[d.getMonth()];
  var date = d.getDate();
  var hour = d.getHours();
  var min = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  var sec = (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();
  var time = date + '. ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;


               console.log("phone number: "+phon_no_id);
               console.log("from: "+from);
               console.log("boady param: "+msg_body);
               console.log("TimeStamp: "+time);
          
               con.connect(function(err){
                 if (err) {
                  return console.error('error: ' + err.message);
                  }
                console.log("database connected");
    
                });
            
               var sql = "INSERT INTO received_messages (msg_to,msg_from,msg,ddtm) VALUES ?";
               var values=[phon_no_id,from,msg_body];
               con.query(sql,[[[phon_no_id,from,msg_body,time]]], function (err, result) {  
                if (err) throw err;  
                console.log("1 record inserted");  
               });
               con.end();
            

               axios({
                   method:"POST",
                   url:"https://graph.facebook.com/v13.0/"+phon_no_id+"/messages?access_token="+token,
                   data:{
                       messaging_product:"whatsapp",
                       to:from,
                       text:{
                           body:"Hi..., your message is "+msg_body
                       }
                   },
                   headers:{
                       "Content-Type":"application/json"
                   }

               });

               res.sendStatus(200);
            }else{
                res.sendStatus(404);
            }

    }

});

app.get("/",(req,res)=>{
    res.status(200).send("hello this is webhook setup");
});
