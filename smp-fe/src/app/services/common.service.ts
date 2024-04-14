import { Injectable } from "@angular/core";


@Injectable({
    providedIn: 'root'
})
export class CommonService {
    todaysDay() {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        const dayOfWeek = today.getDay();
        return dayNames[dayOfWeek];

    }
}