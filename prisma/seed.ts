import {PrismaClient} from '@prisma/client';
import {hash} from 'bcryptjs';
import {categories,demoProducts,demoPosts} from '../lib/catalog-data';
const db=new PrismaClient();
async function main(){
 for(const c of categories)await db.category.upsert({where:{id:c.id},create:c,update:{}});
 for(const p of demoProducts){const {variants,images,...data}=p;await db.product.upsert({where:{id:p.id},update:{},create:{...data,published:true,variants:{create:variants.map(v=>{const {priceTiers,...variant}=v;return {...variant,priceTiers:{create:priceTiers}};})},images:{create:images.map((im,position)=>({...im,position,alt:{en:p.translations.en.name,sq:p.translations.sq.name}}))}}});}
 for(const p of demoPosts)await db.post.upsert({where:{id:p.id},update:{},create:{...p,published:true}});
 await db.siteSetting.upsert({where:{key:'business'},update:{},create:{key:'business',value:{shippingRate:3.5,freeShippingThreshold:50,bankName:'',accountName:'',iban:'',swift:'',email:'',phone:'',address:'',announcement:true}}});
 if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){if(process.env.ADMIN_PASSWORD.length<12)throw new Error('ADMIN_PASSWORD must have at least 12 characters');await db.user.upsert({where:{email:process.env.ADMIN_EMAIL.toLowerCase()},update:{},create:{email:process.env.ADMIN_EMAIL.toLowerCase(),name:'EchoFoil Admin',role:'ADMIN',emailVerified:new Date(),passwordHash:await hash(process.env.ADMIN_PASSWORD,12)}});}
 console.log('Seed complete. Existing records were preserved.');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>db.$disconnect());
