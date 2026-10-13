using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mod.Core.Entities
{
    public class Notification : BaseEntity
    {
        public string Message { get; set; }


        public bool IsRead { get; set; } = false;
        public virtual ICollection<NotificationRolesTarget> NotificationRolesTargets { get; set; } = new HashSet<NotificationRolesTarget>();
        public int FormId { get; set; }
        public FormNameToReturnToFront FormNameToReturnToFront { get; set; }

    }
    public class NotificationRolesTarget : BaseEntity
    {
        public string Role { get; set; }
        public virtual Units? Unit { get; set; }
        public int? UnitId { get; set; }

        // Set when a notification is addressed to one named person rather than to
        // a whole role or unit, which is what a feedback request needs.
        public int? UserId { get; set; }
    }





    // Tells the client which screen a notification belongs to.
    //
    // The name here is matched against the route map in the Angular navbar, so
    // it must stay in step with it. Goals, init and project used to carry names
    // left over from a different product ("document-amendment-request",
    // "external-documents-inventory", "goal-classification"), which matched no
    // route, so clicking any objectives, initiatives, projects or reports
    // notification silently did nothing.
    //
    // The value is persisted as an integer, so the numbers are pinned: changing
    // one would change what every existing notification points at. Only the
    // displayed name is safe to edit, which is why correcting the three names
    // above also repairs every notification already in the database.
    public enum FormNameToReturnToFront
    {
        [Display(Name = "plans")]
        plans = 0,

        [Display(Name = "analysis-stage")]
        analysisstage = 1,

        [Display(Name = "direction-stage")]
        directionstage = 2,

        [Display(Name = "objectives")]
        Goals = 3,

        [Display(Name = "initiatives")]
        init = 4,

        [Display(Name = "projects")]
        project = 5,

        [Display(Name = "reports")]
        reports = 6,

        // Opens the feedback request itself rather than a stage, because the
        // recipient has to read the question and answer it.
        [Display(Name = "feedback")]
        feedback = 7,

        // Opens a shared progress figure (مشاركة نسبة الإنجاز).
        [Display(Name = "progress")]
        progress = 8,

        // The communication and risk plan sheet under the reports stage. Used as
        // a feedback-request subject; it has no notification of its own.
        [Display(Name = "communication")]
        communication = 9,
    }
}
