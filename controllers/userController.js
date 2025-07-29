import sql from "../configs/db.js";


export const getUserCreations = async (req, res) => {
    try{
        const {userId} = req.auth();
        const creations = await sql`SELECT * FROM creations WHERE user_id = ${userId} ORDER BY created_at DESC`;
        
        res.json({success: true, creations});
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

export const getUserPlan = async (req, res) => {
    try{
        const {userId, has} = await req.auth();
        const hasPremium = await has({plan: 'premium'});
        
        res.json({
            success: true, 
            plan: hasPremium ? 'premium' : 'free',
            hasPremium: hasPremium
        });
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

export const getUserStats = async (req, res) => {
    try{
        const {userId} = req.auth();
        const plan = req.plan;
        const freeUsage = req.free_usage;
        
        // Get total creations
        const [totalResult] = await sql`SELECT COUNT(*) as total FROM creations WHERE user_id = ${userId}`;
        const totalCreations = parseInt(totalResult.total);
        
        // Get recent activity (last 24 hours)
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [recentResult] = await sql`SELECT COUNT(*) as recent FROM creations WHERE user_id = ${userId} AND created_at > ${last24Hours}`;
        const recentActivity = parseInt(recentResult.recent);
        
        // Get monthly growth (comparing to last month)
        const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        
        const [currentMonthResult] = await sql`SELECT COUNT(*) as current FROM creations WHERE user_id = ${userId} AND created_at > ${lastMonth}`;
        const [previousMonthResult] = await sql`SELECT COUNT(*) as previous FROM creations WHERE user_id = ${userId} AND created_at > ${twoMonthsAgo} AND created_at <= ${lastMonth}`;
        
        const currentMonth = parseInt(currentMonthResult.current);
        const previousMonth = parseInt(previousMonthResult.previous);
        
        // Calculate growth percentage
        const growthPercentage = previousMonth > 0 ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100) : 0;
        
        res.json({
            success: true, 
            stats: {
                totalCreations,
                recentActivity,
                freeUsage,
                plan,
                growthPercentage,
                remainingFreeUsage: plan === 'free' ? 10 - freeUsage : null
            }
        });
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

export const getPublishedCreations = async (req, res) => {
    try{
        const creations = await sql`SELECT * FROM creations WHERE publish = true ORDER BY created_at DESC`;
        
        res.json({success: true, creations});
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

export const getLikeCreation = async (req, res) => {
    try{
        const {userId} = req.auth();
        const {id} = req.body;

        const [creation]= await sql`SELECT * FROM creations WHERE id = ${id}`;

        if (!creation) {
            return res.json({success: false, message: 'Creation not found.'});
        }

        const currentLike = creation.likes;
        const userIdString = userId.toString();
        let updatedLikes;
        let message;

        if (currentLike.includes(userIdString)) {
            updatedLikes = currentLike.filter(user => user !== userIdString);
            message = 'Creation unliked successfully.';
        } else {
            updatedLikes = [...currentLike, userIdString];
            message = 'Creation liked successfully.';
        }

        const formattedArray = `{${updatedLikes.join(',')}}`;

        await sql`UPDATE creations SET likes = ${formattedArray}::text[] WHERE id = ${id}`;
        
        res.json({success: true, message});
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

export const deleteCreation = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.params;

        // Check if creation exists and belongs to user
        const [creation] = await sql`SELECT * FROM creations WHERE id = ${id} AND user_id = ${userId}`;

        if (!creation) {
            return res.json({success: false, message: 'Creation not found or you do not have permission to delete it.'});
        }

        // Delete the creation
        await sql`DELETE FROM creations WHERE id = ${id} AND user_id = ${userId}`;
        
        res.json({success: true, message: 'Creation deleted successfully.'});
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

export const togglePublish = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.params;

        // Check if creation exists and belongs to user
        const [creation] = await sql`SELECT * FROM creations WHERE id = ${id} AND user_id = ${userId}`;

        if (!creation) {
            return res.json({success: false, message: 'Creation not found or you do not have permission to modify it.'});
        }

        // Toggle publish status
        const newPublishStatus = !creation.publish;
        await sql`UPDATE creations SET publish = ${newPublishStatus} WHERE id = ${id} AND user_id = ${userId}`;
        
        const message = newPublishStatus ? 'Creation published successfully.' : 'Creation unpublished successfully.';
        res.json({success: true, message, publish: newPublishStatus});
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}